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

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func main() {
	dsn := fmt.Sprintf("host=127.0.0.1 port=5432 user=%s password=%s dbname=%s sslmode=disable",
		os.Getenv("DB_USER"), os.Getenv("DB_PASSWORD"), os.Getenv("DB_NAME"))

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
