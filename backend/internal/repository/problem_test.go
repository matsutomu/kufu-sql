package repository

import (
	"testing"
	"time"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/stretchr/testify/assert"
)

func TestGetProblems(t *testing.T) {
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	now := time.Now()
	rows := sqlmock.NewRows([]string{
		"id", "category_id", "title", "description",
		"difficulty", "hint", "sort_order", "created_at", "sql_template", "blanks",
	}).AddRow(1, 1, "全カラムを取得する", "SELECT文の基本を学ぶ", "easy", "SELECT * を使います", 1, now, nil, nil)

	mock.ExpectQuery("SELECT id, category_id").WillReturnRows(rows)

	repo := NewProblemRepository(db)
	problems, err := repo.GetProblems()

	assert.NoError(t, err)
	assert.Len(t, problems, 1)
	assert.Equal(t, "全カラムを取得する", problems[0].Title)
	assert.Equal(t, "easy", problems[0].Difficulty)
}

func TestGetProblemDetail(t *testing.T) {
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	now := time.Now()

	mock.ExpectQuery("SELECT id, category_id").WillReturnRows(
		sqlmock.NewRows([]string{
			"id", "category_id", "title", "description",
			"difficulty", "hint", "sort_order", "created_at", "sql_template", "blanks",
		}).AddRow(1, 1, "全カラムを取得する", "SELECT文の基本", "easy", "ヒント", 1, now, nil, nil),
	)

	mock.ExpectQuery("SELECT id, problem_id, ddl").WillReturnRows(
		sqlmock.NewRows([]string{"id", "problem_id", "ddl", "seed_data"}).
			AddRow(1, 1, "CREATE TABLE employees (id INTEGER)", "INSERT INTO employees VALUES (1)"),
	)

	mock.ExpectQuery("SELECT id, problem_id, answer_sql").WillReturnRows(
		sqlmock.NewRows([]string{"id", "problem_id", "answer_sql", "result_json"}).
			AddRow(1, 1, "SELECT * FROM employees", `[{"id":1}]`),
	)

	repo := NewProblemRepository(db)
	detail, err := repo.GetProblemDetail(1)

	assert.NoError(t, err)
	assert.Equal(t, "全カラムを取得する", detail.Problem.Title)
	assert.Equal(t, "CREATE TABLE employees (id INTEGER)", detail.Schema.DDL)
	assert.Equal(t, "SELECT * FROM employees", detail.Expected.AnswerSQL)
}
