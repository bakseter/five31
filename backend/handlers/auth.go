package handlers

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"strings"
	"sync"

	"github.com/bakseter/five31/models"
	"github.com/coreos/go-oidc/v3/oidc"
	"gorm.io/gorm"
)

type ctxKey int

const userKey ctxKey = 0

// errUnauthorized marks a missing/invalid token (→ 401). Any other error from
// identity resolution is an infrastructure problem (→ 503).
var errUnauthorized = errors.New("unauthorized")

// authenticator verifies OIDC access tokens forwarded by the gateway. Envoy
// Gateway runs the browser login (SecurityPolicy oidc) and, with
// forwardAccessToken enabled, adds the access token as `Authorization: Bearer`
// on requests it proxies to us. We verify that token against the issuer's JWKS,
// so the backend is a real OIDC resource server, not a header-truster.
//
// When issuer is empty (local dev, no gateway) verification is disabled and
// every request resolves to the default user — so `docker compose up` still
// works with no identity provider.
type authenticator struct {
	issuer   string
	clientID string

	mu sync.Mutex
	v  *oidc.IDTokenVerifier
}

func (a *authenticator) enabled() bool { return a.issuer != "" }

// verifier lazily performs OIDC discovery (and caches the result) so the backend
// doesn't depend on the identity provider being reachable at startup.
func (a *authenticator) verifier(ctx context.Context) (*oidc.IDTokenVerifier, error) {
	a.mu.Lock()
	defer a.mu.Unlock()
	if a.v != nil {
		return a.v, nil
	}
	provider, err := oidc.NewProvider(ctx, a.issuer)
	if err != nil {
		return nil, err
	}
	cfg := &oidc.Config{ClientID: a.clientID}
	if a.clientID == "" {
		cfg.SkipClientIDCheck = true // still checks signature, issuer, expiry
	}
	a.v = provider.Verifier(cfg)
	return a.v, nil
}

// claims is the subset of the token we read. `sub` is the stable identity we key
// users on; the rest are display niceties.
type claims struct {
	Sub               string `json:"sub"`
	PreferredUsername string `json:"preferred_username"`
	Name              string `json:"name"`
	Email             string `json:"email"`
}

// identity returns the caller's stable subject and display name. Empty subject
// with no error means "auth disabled — use the default user".
func (h *Handler) identity(r *http.Request) (subject, name string, err error) {
	if !h.auth.enabled() {
		return "", "", nil
	}
	raw := bearerToken(r)
	if raw == "" {
		return "", "", errUnauthorized
	}
	verifier, err := h.auth.verifier(r.Context())
	if err != nil {
		return "", "", err // discovery/JWKS unreachable → 503, not the user's fault
	}
	tok, err := verifier.Verify(r.Context(), raw)
	if err != nil {
		return "", "", fmt.Errorf("%w: %v", errUnauthorized, err)
	}
	var c claims
	if err := tok.Claims(&c); err != nil {
		return "", "", fmt.Errorf("%w: %v", errUnauthorized, err)
	}
	if c.Sub == "" {
		return "", "", errUnauthorized
	}
	return c.Sub, firstNonEmpty(c.PreferredUsername, c.Name, c.Email, c.Sub), nil
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
		subject, name, err := h.identity(r)
		if err != nil {
			if errors.Is(err, errUnauthorized) {
				writeError(w, http.StatusUnauthorized, fmt.Sprintf("unauthorized: %w", err))
			} else {
				writeError(w, http.StatusServiceUnavailable, fmt.Sprintf("auth provider unavailable: %w", err))
			}
			return
		}
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

func bearerToken(r *http.Request) string {
	h := r.Header.Get("Authorization")
	if len(h) > 7 && strings.EqualFold(h[:7], "bearer ") {
		return strings.TrimSpace(h[7:])
	}
	return ""
}

func firstNonEmpty(vals ...string) string {
	for _, v := range vals {
		if v != "" {
			return v
		}
	}
	return ""
}
