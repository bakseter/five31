package main

import (
	"errors"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/example/531-tracker/handlers"
	"github.com/example/531-tracker/models"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func main() {
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		log.Fatal("DATABASE_URL is required")
	}

	db := connect(dsn)
	if err := db.AutoMigrate(&models.User{}, &models.Lift{}, &models.CycleLog{}); err != nil {
		log.Fatalf("migrate: %v", err)
	}
	if err := ensureDefaultUser(db); err != nil {
		log.Fatalf("seed: %v", err)
	}

	h := handlers.New(db, os.Getenv("OIDC_ISSUER"), os.Getenv("OIDC_CLIENT_ID"))
	mux := http.NewServeMux()
	mux.HandleFunc("GET /api/health", h.Health)
	mux.HandleFunc("GET /api/me", h.Me)
	mux.HandleFunc("GET /api/lifts", h.GetLifts)
	mux.HandleFunc("PUT /api/lifts", h.UpdateLifts)
	mux.HandleFunc("PUT /api/amrap", h.UpdateAmrap)
	mux.HandleFunc("GET /api/cycle", h.GetCycle)
	mux.HandleFunc("GET /api/cycle/next", h.GetNextCycle)
	mux.HandleFunc("POST /api/cycle/advance", h.AdvanceCycle)
	mux.HandleFunc("GET /api/history", h.GetHistory)

	const addr = ":8080"
	log.Printf("531-tracker listening on %s", addr)
	// WithUser resolves the caller (default user until an auth proxy injects a
	// real identity) for every request except the health probe.
	if err := http.ListenAndServe(addr, h.WithUser(mux)); err != nil {
		log.Fatal(err)
	}
}

// ensureDefaultUser creates the fallback identity and adopts any pre-existing
// user-less rows from before multi-user support, so upgrading in place keeps
// existing training data. Idempotent.
func ensureDefaultUser(db *gorm.DB) error {
	var user models.User
	err := db.Where("subject = ?", models.DefaultSubject).First(&user).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		user = models.User{Subject: models.DefaultSubject, Name: "Default User"}
		if err := db.Create(&user).Error; err != nil {
			return err
		}
	} else if err != nil {
		return err
	}
	// Adopt orphan rows (user_id = 0) left by the single-user schema.
	if err := db.Model(&models.Lift{}).Where("user_id = 0").Update("user_id", user.ID).Error; err != nil {
		return err
	}
	if err := db.Model(&models.CycleLog{}).Where("user_id = 0").Update("user_id", user.ID).Error; err != nil {
		return err
	}
	return models.SeedLifts(db, user.ID)
}

// connect retries so the pod can start before Postgres is accepting connections.
func connect(dsn string) *gorm.DB {
	cfg := &gorm.Config{Logger: logger.Default.LogMode(logger.Warn)}
	for i := 1; i <= 30; i++ {
		db, err := gorm.Open(postgres.Open(dsn), cfg)
		if err == nil {
			return db
		}
		log.Printf("waiting for database (%d/30): %v", i, err)
		time.Sleep(2 * time.Second)
	}
	log.Fatal("could not connect to database after 60s")
	return nil
}
