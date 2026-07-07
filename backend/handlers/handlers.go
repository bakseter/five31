package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"time"

	"github.com/example/531-tracker/models"
	"github.com/example/531-tracker/program"
	"gorm.io/gorm"
)

type Handler struct {
	db   *gorm.DB
	auth *authenticator
}

// New builds the handler. issuer/clientID configure OIDC access-token
// verification; pass empty issuer to disable auth (local dev → default user).
func New(db *gorm.DB, issuer, clientID string) *Handler {
	return &Handler{db: db, auth: &authenticator{issuer: issuer, clientID: clientID}}
}

func (h *Handler) Health(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

// Me returns the caller's resolved identity — useful for showing who's signed
// in, and confirmation that the auth headers are wired through end to end.
func (h *Handler) Me(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, userFrom(r))
}

// GetLifts returns the user's four lifts with their current training maxes.
func (h *Handler) GetLifts(w http.ResponseWriter, r *http.Request) {
	lifts, err := h.loadLifts(userFrom(r).ID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "could not load lifts")
		return
	}
	writeJSON(w, http.StatusOK, lifts)
}

type liftUpdate struct {
	Slug        string  `json:"slug"`
	TrainingMax float64 `json:"trainingMax"`
}

// UpdateLifts sets training maxes for the caller's lifts, then returns the full
// refreshed list. A map update is used so a zero max is still written.
func (h *Handler) UpdateLifts(w http.ResponseWriter, r *http.Request) {
	var updates []liftUpdate
	if err := json.NewDecoder(r.Body).Decode(&updates); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	userID := userFrom(r).ID
	for _, u := range updates {
		if u.TrainingMax < 0 {
			writeError(w, http.StatusBadRequest, "training max must be zero or positive")
			return
		}
		err := h.db.Model(&models.Lift{}).
			Where("user_id = ? AND slug = ?", userID, u.Slug).
			Updates(map[string]any{"training_max": u.TrainingMax}).Error
		if err != nil {
			writeError(w, http.StatusInternalServerError, "could not update lifts")
			return
		}
	}
	h.GetLifts(w, r)
}

// GetCycle computes the current four-week cycle from the stored training maxes.
func (h *Handler) GetCycle(w http.ResponseWriter, r *http.Request) {
	lifts, err := h.loadLifts(userFrom(r).ID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "could not load lifts")
		return
	}
	maxes := make([]program.LiftMax, len(lifts))
	for i, l := range lifts {
		maxes[i] = program.LiftMax{Name: l.Name, Slug: l.Slug, TrainingMax: l.TrainingMax}
	}
	writeJSON(w, http.StatusOK, program.BuildCycle(maxes))
}

type amrapUpdate struct {
	Slug      string `json:"slug"`
	RepsWeek1 *int   `json:"repsWeek1"`
	RepsWeek2 *int   `json:"repsWeek2"`
	RepsWeek3 *int   `json:"repsWeek3"`
}

// UpdateAmrap records the reps hit on each week's AMRAP set for the caller's
// lifts, then returns the refreshed list. A nil value clears that week's entry.
func (h *Handler) UpdateAmrap(w http.ResponseWriter, r *http.Request) {
	var updates []amrapUpdate
	if err := json.NewDecoder(r.Body).Decode(&updates); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	userID := userFrom(r).ID
	for _, u := range updates {
		if negReps(u.RepsWeek1) || negReps(u.RepsWeek2) || negReps(u.RepsWeek3) {
			writeError(w, http.StatusBadRequest, "reps must be zero or positive")
			return
		}
		err := h.db.Model(&models.Lift{}).
			Where("user_id = ? AND slug = ?", userID, u.Slug).
			Updates(map[string]any{
				"reps_week1": u.RepsWeek1,
				"reps_week2": u.RepsWeek2,
				"reps_week3": u.RepsWeek3,
			}).Error
		if err != nil {
			writeError(w, http.StatusInternalServerError, "could not save reps")
			return
		}
	}
	h.GetLifts(w, r)
}

// GetNextCycle previews the suggested next-cycle maxes from this cycle's logged
// AMRAP results. It changes nothing — the client reviews and can override.
func (h *Handler) GetNextCycle(w http.ResponseWriter, r *http.Request) {
	lifts, err := h.loadLifts(userFrom(r).ID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "could not load lifts")
		return
	}
	results := make([]program.LiftResult, len(lifts))
	for i, l := range lifts {
		results[i] = program.LiftResult{
			Slug:        l.Slug,
			Name:        l.Name,
			TrainingMax: l.TrainingMax,
			Reps:        [3]*int{l.RepsWeek1, l.RepsWeek2, l.RepsWeek3},
		}
	}
	writeJSON(w, http.StatusOK, program.SuggestNext(results))
}

type advanceUpdate struct {
	Slug        string  `json:"slug"`
	TrainingMax float64 `json:"trainingMax"`
}

// AdvanceCycle commits the next cycle. In one transaction it snapshots the
// finishing cycle into cycle_logs (permanent history), then writes the chosen
// training maxes (suggested or overridden), bumps the cycle number, and clears
// this cycle's logged reps so the fresh cycle starts blank. Everything is
// scoped to the caller.
func (h *Handler) AdvanceCycle(w http.ResponseWriter, r *http.Request) {
	var updates []advanceUpdate
	if err := json.NewDecoder(r.Body).Decode(&updates); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	for _, u := range updates {
		if u.TrainingMax < 0 {
			writeError(w, http.StatusBadRequest, "training max must be zero or positive")
			return
		}
	}
	userID := userFrom(r).ID

	err := h.db.Transaction(func(tx *gorm.DB) error {
		// Snapshot the current (finishing) state before we overwrite it.
		var lifts []models.Lift
		if err := tx.Where("user_id = ?", userID).Order("sort_order").Find(&lifts).Error; err != nil {
			return err
		}
		logs := make([]models.CycleLog, 0, len(lifts))
		for _, l := range lifts {
			if l.TrainingMax <= 0 {
				continue // an untrained lift isn't part of the history
			}
			logs = append(logs, models.CycleLog{
				UserID:      userID,
				CycleNumber: l.CycleNumber,
				LiftSlug:    l.Slug,
				LiftName:    l.Name,
				TrainingMax: l.TrainingMax,
				RepsWeek1:   l.RepsWeek1,
				RepsWeek2:   l.RepsWeek2,
				RepsWeek3:   l.RepsWeek3,
			})
		}
		if len(logs) > 0 {
			if err := tx.Create(&logs).Error; err != nil {
				return err
			}
		}

		// Apply the advance.
		for _, u := range updates {
			if err := tx.Model(&models.Lift{}).
				Where("user_id = ? AND slug = ?", userID, u.Slug).
				Updates(map[string]any{
					"training_max": u.TrainingMax,
					"cycle_number": gorm.Expr("cycle_number + 1"),
					"reps_week1":   nil,
					"reps_week2":   nil,
					"reps_week3":   nil,
				}).Error; err != nil {
				return err
			}
		}
		return nil
	})
	if err != nil {
		writeError(w, http.StatusInternalServerError, "could not advance cycle")
		return
	}
	h.GetLifts(w, r)
}

// historyEntry is one lift within one completed cycle, enriched with an
// estimated 1RM so the client can chart progress without redoing the math.
type historyEntry struct {
	CycleNumber        int       `json:"cycleNumber"`
	CompletedAt        time.Time `json:"completedAt"`
	Slug               string    `json:"slug"`
	Name               string    `json:"name"`
	TrainingMax        float64   `json:"trainingMax"`
	RepsWeek1          *int      `json:"repsWeek1"`
	RepsWeek2          *int      `json:"repsWeek2"`
	RepsWeek3          *int      `json:"repsWeek3"`
	EstimatedOneRepMax float64   `json:"estimatedOneRepMax"`
}

// GetHistory returns the caller's completed-cycle snapshots, newest cycle first
// and, in each cycle, the lifts in their canonical order (logs are inserted in
// that order, so ascending id preserves it).
func (h *Handler) GetHistory(w http.ResponseWriter, r *http.Request) {
	var logs []models.CycleLog
	if err := h.db.Where("user_id = ?", userFrom(r).ID).
		Order("cycle_number desc, id asc").Find(&logs).Error; err != nil {
		writeError(w, http.StatusInternalServerError, "could not load history")
		return
	}
	out := make([]historyEntry, len(logs))
	for i, l := range logs {
		out[i] = historyEntry{
			CycleNumber:        l.CycleNumber,
			CompletedAt:        l.CreatedAt,
			Slug:               l.LiftSlug,
			Name:               l.LiftName,
			TrainingMax:        l.TrainingMax,
			RepsWeek1:          l.RepsWeek1,
			RepsWeek2:          l.RepsWeek2,
			RepsWeek3:          l.RepsWeek3,
			EstimatedOneRepMax: program.EstimateOneRepMax(l.TrainingMax, [3]*int{l.RepsWeek1, l.RepsWeek2, l.RepsWeek3}),
		}
	}
	writeJSON(w, http.StatusOK, out)
}

func negReps(p *int) bool { return p != nil && *p < 0 }

func (h *Handler) loadLifts(userID uint) ([]models.Lift, error) {
	var lifts []models.Lift
	err := h.db.Where("user_id = ?", userID).Order("sort_order").Find(&lifts).Error
	return lifts, err
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

func writeError(w http.ResponseWriter, status int, msg string) {
	log.Printf("error: %s", msg)
	writeJSON(w, status, map[string]string{"error": msg})
}
