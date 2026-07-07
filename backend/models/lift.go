package models

import "gorm.io/gorm"

// Lift is one of the four main 5/3/1 barbell lifts. TrainingMax is the single
// number all working percentages derive from (Wendler: ~90% of your true 1RM).
// Unit is stored per row for schema simplicity; in practice all four agree.
type Lift struct {
	ID          uint    `gorm:"primaryKey" json:"id"`
	Slug        string  `gorm:"uniqueIndex;size:32" json:"slug"`
	Name        string  `gorm:"size:64" json:"name"`
	TrainingMax float64 `json:"trainingMax"`
	Unit        string  `gorm:"size:2;default:kg" json:"unit"`
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
var seed = []Lift{
	{Slug: "press", Name: "Overhead Press", Unit: "kg", Order: 1},
	{Slug: "deadlift", Name: "Deadlift", Unit: "kg", Order: 2},
	{Slug: "bench", Name: "Bench Press", Unit: "kg", Order: 3},
	{Slug: "squat", Name: "Squat", Unit: "kg", Order: 4},
}

// Seed inserts the four lifts once. Rows that already exist are left untouched,
// so training maxes survive restarts.
func Seed(db *gorm.DB) error {
	for _, l := range seed {
		var count int64
		if err := db.Model(&Lift{}).Where("slug = ?", l.Slug).Count(&count).Error; err != nil {
			return err
		}
		if count == 0 {
			if err := db.Create(&l).Error; err != nil {
				return err
			}
		}
	}
	return nil
}
