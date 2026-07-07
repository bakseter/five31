package main

import (
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
	if err := db.AutoMigrate(&models.Lift{}, &models.CycleLog{}); err != nil {
		log.Fatalf("migrate: %v", err)
	}
	if err := models.Seed(db); err != nil {
		log.Fatalf("seed: %v", err)
	}

	h := handlers.New(db)
	mux := http.NewServeMux()
	mux.HandleFunc("GET /api/health", h.Health)
	mux.HandleFunc("GET /api/lifts", h.GetLifts)
	mux.HandleFunc("PUT /api/lifts", h.UpdateLifts)
	mux.HandleFunc("PUT /api/amrap", h.UpdateAmrap)
	mux.HandleFunc("GET /api/cycle", h.GetCycle)
	mux.HandleFunc("GET /api/cycle/next", h.GetNextCycle)
	mux.HandleFunc("POST /api/cycle/advance", h.AdvanceCycle)
	mux.HandleFunc("GET /api/history", h.GetHistory)

	const addr = ":8080"
	log.Printf("531-tracker listening on %s", addr)
	if err := http.ListenAndServe(addr, mux); err != nil {
		log.Fatal(err)
	}
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
