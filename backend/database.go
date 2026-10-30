package main

import (
	"database/sql"
	_ "embed"
	"encoding/json"
	"fmt"
	"time"

	_ "github.com/go-sql-driver/mysql"
)

var db *sql.DB

//go:embed seed.json
var seedJSON []byte

//go:embed friend_seed.json
var friendSeedJSON []byte

// friendQuestion 朋友版卡牌：每张只有一道题（单面），存到 front_q。
type friendQuestion struct {
	Text string `json:"text"`
}

func initDB() error {
	var err error
	db, err = sql.Open("mysql", cfg.DB)
	if err != nil {
		return fmt.Errorf("打开数据库失败: %w", err)
	}

	db.SetMaxOpenConns(10)
	db.SetMaxIdleConns(3)
	db.SetConnMaxLifetime(5 * time.Minute)

	if err := db.Ping(); err != nil {
		return fmt.Errorf("ping 数据库失败: %w", err)
	}
	logger.Println("MySQL 数据库连接成功")

	if err := ensureSchema(); err != nil {
		return err
	}
	if err := seedSticks(); err != nil {
		logger.Printf("种子数据写入失败（可忽略）: %v", err)
	}
	return nil
}

func ensureSchema() error {
	stmt := `CREATE TABLE IF NOT EXISTS sticks (
		id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
		edition     VARCHAR(16) NOT NULL DEFAULT 'couple',
		sort_order  INT NOT NULL DEFAULT 0,
		front_q     TEXT NOT NULL,
		front_qe    TEXT NOT NULL,
		front_s     TEXT NULL,
		front_se    TEXT NULL,
		back_q      TEXT NOT NULL,
		back_qe     TEXT NOT NULL,
		back_s      TEXT NULL,
		back_se     TEXT NULL,
		created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
		updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
		KEY idx_edition (edition)
	) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`

	if _, err := db.Exec(stmt); err != nil {
		return fmt.Errorf("建表失败: %w", err)
	}
	logger.Println("数据表就绪")
	return nil
}

// seedSticks 首次启动时按版本分别灌入题库，保证两个版本都不为空。
// 各版本独立判断是否已有数据，互不影响。
func seedSticks() error {
	if err := seedCoupleSticks(); err != nil {
		logger.Printf("情侣版种子数据写入失败（可忽略）: %v", err)
	}
	if err := seedFriendSticks(); err != nil {
		logger.Printf("朋友版种子数据写入失败（可忽略）: %v", err)
	}
	return nil
}

func editionCount(edition string) (int, error) {
	var n int
	err := db.QueryRow(`SELECT COUNT(*) FROM sticks WHERE edition = ?`, edition).Scan(&n)
	return n, err
}

func seedCoupleSticks() error {
	n, err := editionCount("couple")
	if err != nil {
		return err
	}
	if n > 0 {
		return nil
	}

	var seed []Stick
	if err := json.Unmarshal(seedJSON, &seed); err != nil {
		return err
	}
	for i, s := range seed {
		_, err := db.Exec(`INSERT INTO sticks
			(edition, sort_order, front_q, front_qe, front_s, front_se, back_q, back_qe, back_s, back_se)
			VALUES (?,?,?,?,?,?,?,?,?,?)`,
			"couple", i,
			s.Front.Q, s.Front.QE, s.Front.S, s.Front.SE,
			s.Back.Q, s.Back.QE, s.Back.S, s.Back.SE)
		if err != nil {
			return err
		}
	}
	logger.Printf("情侣版种子数据写入完成，共 %d 张签", len(seed))
	return nil
}

func seedFriendSticks() error {
	n, err := editionCount("friend")
	if err != nil {
		return err
	}
	if n > 0 {
		return nil
	}

	var seed []friendQuestion
	if err := json.Unmarshal(friendSeedJSON, &seed); err != nil {
		return err
	}
	for i, q := range seed {
		// 朋友版每张卡只有一道题，存到 front_q；背面留空。
		_, err := db.Exec(`INSERT INTO sticks
			(edition, sort_order, front_q, front_qe, front_s, front_se, back_q, back_qe, back_s, back_se)
			VALUES (?,?,?,?,?,?,?,?,?,?)`,
			"friend", i, q.Text, "", "", "", "", "", "", "")
		if err != nil {
			return err
		}
	}
	logger.Printf("朋友版种子数据写入完成，共 %d 张卡", len(seed))
	return nil
}
