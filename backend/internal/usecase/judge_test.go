package usecase

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestJudge_Correct(t *testing.T) {
	u := NewJudgeUsecase()
	req := JudgeRequest{
		ProblemID: 1,
		ResultRows: []map[string]any{
			{"id": "1", "name": "Alice"},
			{"id": "2", "name": "Bob"},
		},
	}
	expected := `[{"id":"1","name":"Alice"},{"id":"2","name":"Bob"}]`
	res := u.Judge(req, expected, "ヒント")
	assert.True(t, res.IsCorrect)
	assert.Equal(t, "正解です！", res.Message)
}

func TestJudge_WrongRowCount(t *testing.T) {
	u := NewJudgeUsecase()
	req := JudgeRequest{
		ProblemID:  1,
		ResultRows: []map[string]any{{"id": "1", "name": "Alice"}},
	}
	expected := `[{"id":"1","name":"Alice"},{"id":"2","name":"Bob"}]`
	res := u.Judge(req, expected, "ヒント")
	assert.False(t, res.IsCorrect)
	assert.Contains(t, res.Message, "行数が違います")
}

func TestJudge_WrongValue(t *testing.T) {
	u := NewJudgeUsecase()
	req := JudgeRequest{
		ProblemID:  1,
		ResultRows: []map[string]any{{"id": "1", "name": "Wrong"}},
	}
	expected := `[{"id":"1","name":"Alice"}]`
	res := u.Judge(req, expected, "ヒント")
	assert.False(t, res.IsCorrect)
	assert.Contains(t, res.Message, "値が異なります")
}
