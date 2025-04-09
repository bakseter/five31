package models

import (
	"time"

	"gorm.io/gorm"
)

type Workout struct {
	gorm.Model
	ID       uint `gorm:"primaryKey"`
	Date     time.Time
	Cycle    int
	Week     int
	Day      int
	Exercise string
	Reps     int
}
