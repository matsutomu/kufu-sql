package handler

import (
	"encoding/json"
	"net/http"

	"github.com/matsutomu/kufu-sql/backend/internal/domain"
	"github.com/matsutomu/kufu-sql/backend/internal/repository"
)

type ProgressHandler struct {
	repo *repository.ProgressRepository
}

func NewProgressHandler(repo *repository.ProgressRepository) *ProgressHandler {
	return &ProgressHandler{repo: repo}
}

func (h *ProgressHandler) GetProgress(w http.ResponseWriter, r *http.Request) {
	sessionID := r.URL.Query().Get("session_id")
	if sessionID == "" {
		http.Error(w, "session_id is required", http.StatusBadRequest)
		return
	}

	progress, err := h.repo.GetProgress(sessionID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if progress == nil {
		progress = []domain.Progress{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(progress)
}
