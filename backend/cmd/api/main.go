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
	_ "github.com/lib/pq"
)

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

	repo := repository.NewProblemRepository(db)
	ph := handler.NewProblemHandler(repo)

	http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
	})
	http.HandleFunc("/api/problems", ph.GetProblems)
	http.HandleFunc("/api/problems/", ph.GetProblemDetail)

	log.Println("kufu:SQL API starting on :8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
