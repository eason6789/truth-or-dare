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

// seedSticks 首次启动时把 seed.json 里的题库灌入数据库，保证游戏不为空。
func seedSticks() error {
	var n int
	_ = db.QueryRow(`SELECT COUNT(*) FROM sticks`).Scan(&n)
	if n > 0 {
		return nil
	}

	var seed []Stick
	if err := json.Unmarshal(seedJSON, &seed); err != nil {
		return err
	}
	for i, s := range seed {
		edition := s.Edition
		if edition == "" {
			edition = "couple"
		}
		_, err := db.Exec(`INSERT INTO sticks
			(edition, sort_order, front_q, front_qe, front_s, front_se, back_q, back_qe, back_s, back_se)
			VALUES (?,?,?,?,?,?,?,?,?,?)`,
			edition, i,
			s.Front.Q, s.Front.QE, s.Front.S, s.Front.SE,
			s.Back.Q, s.Back.QE, s.Back.S, s.Back.SE)
		if err != nil {
			return err
		}
	}
	logger.Printf("种子数据写入完成，共 %d 张签", len(seed))
	return nil
}
