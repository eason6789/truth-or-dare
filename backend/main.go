package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
)

var logger *log.Logger

func init() {
	logger = log.New(os.Stdout, "[TRUTHDARE] ", log.LstdFlags|log.Lshortfile)

	if err := loadConfig(); err != nil {
		logger.Fatalf("配置加载失败: %v", err)
	}
	logger.Printf("环境: %s, 端口: %s", cfg.Env, cfg.Port)

	if err := initDB(); err != nil {
		logger.Fatalf("数据库初始化失败: %v", err)
	}
}

func corsMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}
		next(w, r)
	}
}

func jsonResp(w http.ResponseWriter, success bool, msg string, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": success,
		"message": msg,
		"data":    data,
	})
}

func main() {
	logger.Printf("========================================")
	logger.Printf("孩子气·真心话 题库后端 v1.0")
	logger.Printf("环境: %s  端口: %s", cfg.Env, cfg.Port)
	logger.Printf("========================================")

	mux := http.NewServeMux()

	mux.HandleFunc("GET /api/health", corsMiddleware(handleHealth))
	mux.HandleFunc("GET /api/sticks", corsMiddleware(handleListSticks))
	mux.HandleFunc("POST /api/sticks", corsMiddleware(handleCreateStick))
	mux.HandleFunc("PUT /api/sticks/{id}", corsMiddleware(handleUpdateStick))
	mux.HandleFunc("DELETE /api/sticks/{id}", corsMiddleware(handleDeleteStick))

	logger.Printf("服务就绪")
	logger.Fatal(http.ListenAndServe(cfg.Port, mux))
}
