package usecase

import (
	"encoding/json"
	"fmt"
)

type JudgeRequest struct {
	ProblemID   int              `json:"problem_id"`
	SessionID   string           `json:"session_id"`
	ResultRows  []map[string]any `json:"result_rows"`
}

type JudgeResponse struct {
	IsCorrect bool   `json:"is_correct"`
	Message   string `json:"message"`
	Hint      string `json:"hint,omitempty"`
}

type JudgeUsecase struct{}

func NewJudgeUsecase() *JudgeUsecase {
	return &JudgeUsecase{}
}

func (u *JudgeUsecase) Judge(req JudgeRequest, expectedJSON string, hint string) JudgeResponse {
	var expected []map[string]any
	if err := json.Unmarshal([]byte(expectedJSON), &expected); err != nil {
		return JudgeResponse{IsCorrect: false, Message: "採点エラーが発生しました"}
	}

	if len(req.ResultRows) != len(expected) {
		return JudgeResponse{
			IsCorrect: false,
			Message:   fmt.Sprintf("行数が違います（期待: %d行、実際: %d行）", len(expected), len(req.ResultRows)),
			Hint:      hint,
		}
	}

	for i, expRow := range expected {
		actRow := req.ResultRows[i]
		for key, expVal := range expRow {
			actVal, ok := actRow[key]
			if !ok {
				return JudgeResponse{
					IsCorrect: false,
					Message:   fmt.Sprintf("カラム '%s' が見つかりません", key),
					Hint:      hint,
				}
			}
			if fmt.Sprintf("%v", expVal) != fmt.Sprintf("%v", actVal) {
				return JudgeResponse{
					IsCorrect: false,
					Message:   fmt.Sprintf("値が異なります（カラム: %s）", key),
					Hint:      hint,
				}
			}
		}
	}

	return JudgeResponse{IsCorrect: true, Message: "正解です！"}
}
