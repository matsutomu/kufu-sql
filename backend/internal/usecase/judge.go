package usecase

import (
	"encoding/json"
	"fmt"
	"slices"
	"strconv"
	"strings"
)

type JudgeRequest struct {
	ProblemID  int              `json:"problem_id"`
	SessionID  string           `json:"session_id"`
	ResultRows []map[string]any `json:"result_rows"`
	// AnswerMode は "pc" または "mobile"。どちらのUIで回答したかのログ用（採点には使わない）
	AnswerMode string `json:"answer_mode,omitempty"`
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

// normalizeValue は値を比較用の文字列へ正規化する。
// 数値は "410000.0" と "410000" のような表記ゆれを同一視する。
func normalizeValue(v any) string {
	s := fmt.Sprintf("%v", v)
	if f, err := strconv.ParseFloat(strings.TrimSpace(s), 64); err == nil {
		return strconv.FormatFloat(f, 'f', -1, 64)
	}
	return s
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

		// カラム名は大文字・小文字を区別せずに照合する
		actByLower := make(map[string]any, len(actRow))
		for k, v := range actRow {
			actByLower[strings.ToLower(k)] = v
		}

		consumed := make(map[string]bool, len(actRow))
		var unmatchedKeys []string
		var unmatchedVals []string
		for key, expVal := range expRow {
			lower := strings.ToLower(key)
			actVal, ok := actByLower[lower]
			if !ok {
				// COUNT(*) と COUNT(id) のように列名が一致しない場合は後で値同士を照合する
				unmatchedKeys = append(unmatchedKeys, key)
				unmatchedVals = append(unmatchedVals, normalizeValue(expVal))
				continue
			}
			consumed[lower] = true
			if normalizeValue(expVal) != normalizeValue(actVal) {
				return JudgeResponse{
					IsCorrect: false,
					Message:   fmt.Sprintf("値が異なります（カラム: %s）", key),
					Hint:      hint,
				}
			}
		}

		if len(unmatchedKeys) > 0 {
			var leftover []string
			for k, v := range actByLower {
				if !consumed[k] {
					leftover = append(leftover, normalizeValue(v))
				}
			}
			slices.Sort(unmatchedVals)
			slices.Sort(leftover)
			if !slices.Equal(unmatchedVals, leftover) {
				return JudgeResponse{
					IsCorrect: false,
					Message:   fmt.Sprintf("値が異なります（カラム: %s）", strings.Join(unmatchedKeys, ", ")),
					Hint:      hint,
				}
			}
		}
	}

	return JudgeResponse{IsCorrect: true, Message: "正解です！"}
}
