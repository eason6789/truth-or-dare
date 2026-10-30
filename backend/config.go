package main

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
)

type Config struct {
	Port string `json:"port"`
	Env  string `json:"env"`
	DB   string `json:"db"`
}

var cfg Config

func loadConfig() error {
	env := os.Getenv("ENV")
	if env == "" {
		env = "dev"
	}

	candidates := []string{
		filepath.Join("config", fmt.Sprintf("config.%s.json", env)),
		filepath.Join("config", "config.json"),
		fmt.Sprintf("config.%s.json", env),
		"config.json",
	}

	var data []byte
	var err error
	for _, path := range candidates {
		data, err = os.ReadFile(path)
		if err == nil {
			logger.Printf("加载配置: %s", path)
			break
		}
	}
	if err != nil {
		return fmt.Errorf("未找到配置文件，请提供 config/config.%s.json", env)
	}

	if err := json.Unmarshal(data, &cfg); err != nil {
		return fmt.Errorf("解析配置失败: %w", err)
	}
	return nil
}
