package repository

import (
	"database/sql"
	"fmt"
	"time"

	"github.com/matsutomu/kufu-sql/backend/internal/domain"
)

type ProgressRepository struct {
	db *sql.DB
}

func NewProgressRepository(db *sql.DB) *ProgressRepository {
	return &ProgressRepository{db: db}
}

func (r *ProgressRepository) GetProgress(sessionID string) ([]domain.Progress, error) {
	rows, err := r.db.Query(`
		SELECT id, session_id, problem_id, is_correct, attempts, solved_at, created_at
		FROM progress WHERE session_id = $1`, sessionID)
	if err != nil {
		return nil, fmt.Errorf("GetProgress: %w", err)
	}
	defer rows.Close()

	var list []domain.Progress
	for rows.Next() {
		var p domain.Progress
		if err := rows.Scan(&p.ID, &p.SessionID, &p.ProblemID,
			&p.IsCorrect, &p.Attempts, &p.SolvedAt, &p.CreatedAt); err != nil {
			return nil, fmt.Errorf("GetProgress scan: %w", err)
		}
		list = append(list, p)
	}
	return list, nil
}

func (r *ProgressRepository) UpsertProgress(sessionID string, problemID int, isCorrect bool) error {
	now := time.Now()
	var solvedAt *time.Time
	if isCorrect {
		solvedAt = &now
	}

	_, err := r.db.Exec(`
		INSERT INTO progress (session_id, problem_id, is_correct, attempts, solved_at)
		VALUES ($1, $2, $3, 1, $4)
		ON CONFLICT (session_id, problem_id)
		DO UPDATE SET
			attempts   = progress.attempts + 1,
			is_correct = EXCLUDED.is_correct,
			solved_at  = CASE WHEN EXCLUDED.is_correct THEN EXCLUDED.solved_at
			                  ELSE progress.solved_at END`,
		sessionID, problemID, isCorrect, solvedAt)
	if err != nil {
		return fmt.Errorf("UpsertProgress: %w", err)
	}
	return nil
}
