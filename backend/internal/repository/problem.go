package repository

import (
	"database/sql"
	"fmt"

	"github.com/matsutomu/kufu-sql/backend/internal/domain"
	_ "github.com/lib/pq"
)

type ProblemRepository struct {
	db *sql.DB
}

func NewProblemRepository(db *sql.DB) *ProblemRepository {
	return &ProblemRepository{db: db}
}

func (r *ProblemRepository) GetProblems() ([]domain.Problem, error) {
	rows, err := r.db.Query(`
		SELECT id, category_id, title, description, difficulty, hint, sort_order, created_at
		FROM problems ORDER BY category_id, sort_order`)
	if err != nil {
		return nil, fmt.Errorf("GetProblems: %w", err)
	}
	defer rows.Close()

	var problems []domain.Problem
	for rows.Next() {
		var p domain.Problem
		if err := rows.Scan(&p.ID, &p.CategoryID, &p.Title, &p.Description,
			&p.Difficulty, &p.Hint, &p.SortOrder, &p.CreatedAt); err != nil {
			return nil, fmt.Errorf("GetProblems scan: %w", err)
		}
		problems = append(problems, p)
	}
	return problems, nil
}

func (r *ProblemRepository) GetProblemDetail(id int) (*domain.ProblemDetail, error) {
	var detail domain.ProblemDetail

	err := r.db.QueryRow(`
		SELECT id, category_id, title, description, difficulty, hint, sort_order, created_at
		FROM problems WHERE id = $1`, id).Scan(
		&detail.Problem.ID, &detail.Problem.CategoryID, &detail.Problem.Title,
		&detail.Problem.Description, &detail.Problem.Difficulty, &detail.Problem.Hint,
		&detail.Problem.SortOrder, &detail.Problem.CreatedAt)
	if err != nil {
		return nil, fmt.Errorf("GetProblemDetail: %w", err)
	}

	err = r.db.QueryRow(`
		SELECT id, problem_id, ddl, seed_data
		FROM schemas WHERE problem_id = $1`, id).Scan(
		&detail.Schema.ID, &detail.Schema.ProblemID,
		&detail.Schema.DDL, &detail.Schema.SeedData)
	if err != nil {
		return nil, fmt.Errorf("GetProblemDetail schema: %w", err)
	}

	err = r.db.QueryRow(`
		SELECT id, problem_id, answer_sql, result_json
		FROM expected_results WHERE problem_id = $1`, id).Scan(
		&detail.Expected.ID, &detail.Expected.ProblemID,
		&detail.Expected.AnswerSQL, &detail.Expected.ResultJSON)
	if err != nil {
		return nil, fmt.Errorf("GetProblemDetail expected: %w", err)
	}

	return &detail, nil
}
