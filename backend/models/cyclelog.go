package models

import "time"

// CycleLog is an immutable snapshot of one lift as a cycle was completed: the
// training max worked that cycle and the reps hit on each week's AMRAP set.
// One row is written per trained lift each time a cycle advances, so the table
// is the permanent training history. CreatedAt (set by GORM) is the completion
// time. Nothing here is ever updated — only inserted and read.
type CycleLog struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	UserID      uint      `gorm:"index" json:"-"`
	CycleNumber int       `gorm:"index" json:"cycleNumber"`
	LiftSlug    string    `gorm:"size:32;index" json:"slug"`
	LiftName    string    `gorm:"size:64" json:"name"`
	TrainingMax float64   `json:"trainingMax"`
	RepsWeek1   *int      `gorm:"column:reps_week1" json:"repsWeek1"`
	RepsWeek2   *int      `gorm:"column:reps_week2" json:"repsWeek2"`
	RepsWeek3   *int      `gorm:"column:reps_week3" json:"repsWeek3"`
	CreatedAt   time.Time `json:"completedAt"`
}
