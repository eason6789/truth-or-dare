-- 孩子气·真心话 后端表结构（参考文档，实际由 database.go 启动时自动建表）
-- MySQL 8.x, utf8mb4

CREATE TABLE IF NOT EXISTS sticks (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  edition     VARCHAR(16) NOT NULL DEFAULT 'couple',  -- couple / friend
  sort_order  INT NOT NULL DEFAULT 0,
  front_q     TEXT NOT NULL,      -- 正面题目（白面）
  front_qe    TEXT NOT NULL,      -- 正面英文副题
  front_s     TEXT NULL,          -- 正面替换词（、分隔，可选）
  front_se    TEXT NULL,          -- 正面替换词英文
  back_q      TEXT NOT NULL,      -- 反面题目（红面）
  back_qe     TEXT NOT NULL,      -- 反面英文副题
  back_s      TEXT NULL,          -- 反面替换词（、分隔，可选）
  back_se     TEXT NULL,          -- 反面替换词英文
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_edition (edition)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
