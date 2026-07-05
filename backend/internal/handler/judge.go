package handler

import (
	"encoding/json"
	"log"
	"net/http"
	"strings"

	"github.com/matsutomu/kufu-sql/backend/internal/repository"
	"github.com/matsutomu/kufu-sql/backend/internal/usecase"
)

const maxRequestBodySize = 1 << 20 // 1MB

type JudgeHandler struct {
	repo         *repository.ProblemRepository
	progressRepo *repository.ProgressRepository
	usecase      *usecase.JudgeUsecase
}

func NewJudgeHandler(repo *repository.ProblemRepository, progressRepo *repository.ProgressRepository, uc *usecase.JudgeUsecase) *JudgeHandler {
	return &JudgeHandler{repo: repo, progressRepo: progressRepo, usecase: uc}
}

func (h *JudgeHandler) Judge(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	r.Body = http.MaxBytesReader(w, r.Body, maxRequestBodySize)

	var req usecase.JudgeRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}

	if req.ProblemID <= 0 {
		http.Error(w, "invalid problem_id", http.StatusBadRequest)
		return
	}

	if req.SessionID != "" && (len(req.SessionID) > 128 || strings.ContainsAny(req.SessionID, "<>\"'")) {
		http.Error(w, "invalid session_id", http.StatusBadRequest)
		return
	}

	detail, err := h.repo.GetProblemDetail(req.ProblemID)
	if err != nil {
		log.Printf("Judge GetProblemDetail error: %v", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	res := h.usecase.Judge(req, detail.Expected.ResultJSON, detail.Problem.Hint)

	if req.SessionID != "" {
		if err := h.progressRepo.UpsertProgress(req.SessionID, req.ProblemID, res.IsCorrect); err != nil {
			log.Printf("UpsertProgress error: %v", err)
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(res)
}
