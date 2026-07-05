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

// 小文字で書いた集計関数（count(*)など）でもカラム名を区別せず正解になる
func TestJudge_CaseInsensitiveColumn(t *testing.T) {
	u := NewJudgeUsecase()
	req := JudgeRequest{
		ProblemID:  9,
		ResultRows: []map[string]any{{"count(*)": "3"}},
	}
	expected := `[{"COUNT(*)":"3"}]`
	res := u.Judge(req, expected, "ヒント")
	assert.True(t, res.IsCorrect)
}

// AVGなどの期待値 "410000.0" と実行結果 "410000" を同一視する
func TestJudge_NumericNormalization(t *testing.T) {
	u := NewJudgeUsecase()
	req := JudgeRequest{
		ProblemID:  11,
		ResultRows: []map[string]any{{"AVG(salary)": "410000"}},
	}
	expected := `[{"AVG(salary)":"410000.0"}]`
	res := u.Judge(req, expected, "ヒント")
	assert.True(t, res.IsCorrect)
}

// COUNT(id) など期待と異なる列名でも、値が一致していれば正解になる
func TestJudge_DifferentAggregateColumn(t *testing.T) {
	u := NewJudgeUsecase()
	req := JudgeRequest{
		ProblemID: 14,
		ResultRows: []map[string]any{
			{"department": "営業", "COUNT(id)": "2"},
			{"department": "開発", "COUNT(ID)": "1"},
		},
	}
	expected := `[{"department":"営業","COUNT(*)":"2"},{"department":"開発","COUNT(*)":"1"}]`
	res := u.Judge(req, expected, "ヒント")
	assert.True(t, res.IsCorrect)
}

// 列名が異なり、かつ値も一致しない場合は不正解のまま
func TestJudge_DifferentColumnWrongValue(t *testing.T) {
	u := NewJudgeUsecase()
	req := JudgeRequest{
		ProblemID:  14,
		ResultRows: []map[string]any{{"department": "営業", "COUNT(id)": "5"}},
	}
	expected := `[{"department":"営業","COUNT(*)":"2"}]`
	res := u.Judge(req, expected, "ヒント")
	assert.False(t, res.IsCorrect)
	assert.Contains(t, res.Message, "値が異なります")
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
