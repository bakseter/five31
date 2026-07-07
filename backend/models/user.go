package models

import "time"

// User owns a set of lifts and a training history. For now a single default
// user is resolved for every request, but every data row is already keyed on a
// user, and identity is resolved from a stable Subject — so switching on real
// per-user auth later (forward-auth headers or an OIDC `sub` claim) needs no
// schema change, only a different Subject arriving on the request.
type User struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Subject   string    `gorm:"uniqueIndex;size:255" json:"subject"` // stable auth identifier
	Name      string    `gorm:"size:255" json:"name"`
	CreatedAt time.Time `json:"-"`
}

// DefaultSubject is the identity every request falls back to while auth is off.
const DefaultSubject = "default"
