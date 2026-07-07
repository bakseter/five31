package models

import "gorm.io/gorm"

// Lift is one of the four main 5/3/1 barbell lifts, owned by a user. All weights
// are kilograms and derive from TrainingMax (Wendler: ~90% of your true 1RM).
// (UserID, Slug) is unique, so each user has exactly one row per lift.
type Lift struct {
	ID          uint    `gorm:"primaryKey" json:"id"`
	UserID      uint    `gorm:"uniqueIndex:idx_user_slug,priority:1" json:"-"`
	Slug        string  `gorm:"uniqueIndex:idx_user_slug,priority:2;size:32" json:"slug"`
	Name        string  `gorm:"size:64" json:"name"`
	TrainingMax float64 `json:"trainingMax"`
	Order       int     `gorm:"column:sort_order" json:"order"`

	// Which cycle the lift is currently on (1-based), bumped on advance.
	CycleNumber int `gorm:"default:1" json:"cycleNumber"`

	// Reps performed on each loading week's AMRAP ("+") set this cycle.
	// Nil means "not logged yet"; cleared back to nil when the cycle advances.
	RepsWeek1 *int `gorm:"column:reps_week1" json:"repsWeek1"`
	RepsWeek2 *int `gorm:"column:reps_week2" json:"repsWeek2"`
	RepsWeek3 *int `gorm:"column:reps_week3" json:"repsWeek3"`
}

// The canonical four lifts, in the usual 5/3/1 four-day order.
var seedLifts = []Lift{
	{Slug: "press", Name: "Overhead Press", Order: 1},
	{Slug: "deadlift", Name: "Deadlift", Order: 2},
	{Slug: "bench", Name: "Bench Press", Order: 3},
	{Slug: "squat", Name: "Squat", Order: 4},
}

// SeedLifts gives one user their four lifts. Rows that already exist are left
// untouched, so training maxes survive restarts and re-seeding is a no-op.
func SeedLifts(db *gorm.DB, userID uint) error {
	for _, l := range seedLifts {
		var count int64
		if err := db.Model(&Lift{}).
			Where("user_id = ? AND slug = ?", userID, l.Slug).
			Count(&count).Error; err != nil {
			return err
		}
		if count == 0 {
			row := l
			row.UserID = userID
			if err := db.Create(&row).Error; err != nil {
				return err
			}
		}
	}
	return nil
}
