package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/matsutomu/kufu-sql/backend/internal/handler"
	"github.com/matsutomu/kufu-sql/backend/internal/repository"
	"github.com/matsutomu/kufu-sql/backend/internal/usecase"
	_ "github.com/lib/pq"
)

var allowedOrigins = []string{
	"https://kufusql.sanpo-insight.com",
	"http://localhost:5173",
}

func isAllowedOrigin(origin string) bool {
	for _, o := range allowedOrigins {
		if o == origin {
			return true
		}
	}
	return false
}

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Allow-Originの値がOriginごとに変わるため、中間キャッシュの誤共有を防ぐ
		w.Header().Set("Vary", "Origin")
		origin := r.Header.Get("Origin")
		if isAllowedOrigin(origin) {
			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		}
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func main() {
	dbUser := os.Getenv("DB_USER")
	dbPassword := os.Getenv("DB_PASSWORD")
	dbName := os.Getenv("DB_NAME")

	if dbUser == "" || dbPassword == "" || dbName == "" {
		log.Fatal("環境変数 DB_USER, DB_PASSWORD, DB_NAME が設定されていません")
	}

	dsn := fmt.Sprintf("host=127.0.0.1 port=5432 user=%s password=%s dbname=%s sslmode=disable",
		dbUser, dbPassword, dbName)

	db, err := sql.Open("postgres", dsn)
	if err != nil {
		log.Fatalf("DB接続エラー: %v", err)
	}
	defer db.Close()

	if err := db.Ping(); err != nil {
		log.Fatalf("DB疎通エラー: %v", err)
	}
	log.Println("DB接続成功")

	problemRepo  := repository.NewProblemRepository(db)
	progressRepo := repository.NewProgressRepository(db)

	ph  := handler.NewProblemHandler(problemRepo)
	jh  := handler.NewJudgeHandler(problemRepo, progressRepo, usecase.NewJudgeUsecase())
	prh := handler.NewProgressHandler(progressRepo)

	mux := http.NewServeMux()
	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
	})
	mux.HandleFunc("/api/problems", ph.GetProblems)
	mux.HandleFunc("/api/problems/", ph.GetProblemDetail)
	mux.HandleFunc("/api/judge", jh.Judge)
	mux.HandleFunc("/api/progress", prh.GetProgress)

	log.Println("kufu:SQL API starting on :8080")
	log.Fatal(http.ListenAndServe(":8080", corsMiddleware(mux)))
}
