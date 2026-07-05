package handler

import (
	"encoding/json"
	"log"
	"net/http"
	"strings"

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
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	sessionID := r.URL.Query().Get("session_id")
	if sessionID == "" {
		http.Error(w, "session_id is required", http.StatusBadRequest)
		return
	}
	if len(sessionID) > 128 || strings.ContainsAny(sessionID, "<>\"'") {
		http.Error(w, "invalid session_id", http.StatusBadRequest)
		return
	}

	progress, err := h.repo.GetProgress(sessionID)
	if err != nil {
		log.Printf("GetProgress error: %v", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	if progress == nil {
		progress = []domain.Progress{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(progress)
}
