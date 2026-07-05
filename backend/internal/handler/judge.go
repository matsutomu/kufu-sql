package handler

import (
	"encoding/json"
	"net/http"

	"github.com/matsutomu/kufu-sql/backend/internal/repository"
	"github.com/matsutomu/kufu-sql/backend/internal/usecase"
)

type JudgeHandler struct {
	repo    *repository.ProblemRepository
	usecase *usecase.JudgeUsecase
}

func NewJudgeHandler(repo *repository.ProblemRepository, uc *usecase.JudgeUsecase) *JudgeHandler {
	return &JudgeHandler{repo: repo, usecase: uc}
}

func (h *JudgeHandler) Judge(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req usecase.JudgeRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}

	detail, err := h.repo.GetProblemDetail(req.ProblemID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	res := h.usecase.Judge(req, detail.Expected.ResultJSON, detail.Problem.Hint)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(res)
}
