package domain

import "time"

type Category struct {
	ID          int       `json:"id"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	SortOrder   int       `json:"sort_order"`
	CreatedAt   time.Time `json:"created_at"`
}

type Problem struct {
	ID          int       `json:"id"`
	CategoryID  int       `json:"category_id"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	Difficulty  string    `json:"difficulty"`
	Hint        string    `json:"hint"`
	SortOrder   int       `json:"sort_order"`
	CreatedAt   time.Time `json:"created_at"`
}

type Schema struct {
	ID        int    `json:"id"`
	ProblemID int    `json:"problem_id"`
	DDL       string `json:"ddl"`
	SeedData  string `json:"seed_data"`
}

type ExpectedResult struct {
	ID         int    `json:"id"`
	ProblemID  int    `json:"problem_id"`
	AnswerSQL  string `json:"answer_sql"`
	ResultJSON string `json:"result_json"`
}

type Progress struct {
	ID        int        `json:"id"`
	SessionID string     `json:"session_id"`
	ProblemID int        `json:"problem_id"`
	IsCorrect bool       `json:"is_correct"`
	Attempts  int        `json:"attempts"`
	SolvedAt  *time.Time `json:"solved_at"`
	CreatedAt time.Time  `json:"created_at"`
}

type ProblemDetail struct {
	Problem  Problem  `json:"problem"`
	Schema   Schema   `json:"schema"`
	Expected ExpectedResult `json:"expected"`
}
