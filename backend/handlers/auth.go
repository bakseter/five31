package handlers

import (
	"context"
	"errors"
	"net/http"
	"os"
	"strings"

	"github.com/example/531-tracker/models"
	"gorm.io/gorm"
)

type ctxKey int

const userKey ctxKey = 0

// Header names are configurable so the same binary works behind Authentik
// forward-auth (which injects X-Authentik-Username), any other auth proxy, or
// nothing at all. Point AUTH_USER_HEADER at whatever your gateway forwards.
var (
	userHeader = envOr("AUTH_USER_HEADER", "X-Auth-Subject")
	nameHeader = envOr("AUTH_NAME_HEADER", "X-Auth-Name")
)

// identity extracts the caller's stable subject and display name from the
// request. With no auth proxy in front the subject is empty and the caller
// falls back to the single default user.
//
// This is the ONE place identity enters the system. Moving from forward-auth
// headers to gateway-issued OIDC means parsing the bearer/JWT `sub` claim here
// and returning it as the subject — nothing downstream changes.
func identity(r *http.Request) (subject, name string) {
	subject = strings.TrimSpace(r.Header.Get(userHeader))
	name = strings.TrimSpace(r.Header.Get(nameHeader))
	return subject, name
}

// WithUser resolves (or creates) the user for each request, seeds their lifts on
// first sight, and stores them in the request context so handlers can scope
// every query by user. Health checks skip this so probes stay cheap.
func (h *Handler) WithUser(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/api/health" {
			next.ServeHTTP(w, r)
			return
		}
		subject, name := identity(r)
		if subject == "" {
			subject, name = models.DefaultSubject, "Default User"
		}
		user, err := h.resolveUser(subject, name)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "could not resolve user")
			return
		}
		ctx := context.WithValue(r.Context(), userKey, user)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// resolveUser is find-or-create by subject; a brand-new user gets their four
// lifts seeded in the same transaction, so any authenticated identity that
// shows up for the first time is immediately ready to use.
func (h *Handler) resolveUser(subject, name string) (*models.User, error) {
	var user models.User
	err := h.db.Transaction(func(tx *gorm.DB) error {
		res := tx.Where("subject = ?", subject).First(&user)
		if res.Error == nil {
			return nil
		}
		if !errors.Is(res.Error, gorm.ErrRecordNotFound) {
			return res.Error
		}
		user = models.User{Subject: subject, Name: name}
		if err := tx.Create(&user).Error; err != nil {
			return err
		}
		return models.SeedLifts(tx, user.ID)
	})
	if err != nil {
		return nil, err
	}
	return &user, nil
}

// userFrom returns the request's resolved user (always present after WithUser).
func userFrom(r *http.Request) *models.User {
	u, _ := r.Context().Value(userKey).(*models.User)
	return u
}

func envOr(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}
