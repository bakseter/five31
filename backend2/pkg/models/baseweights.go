package models

import (
	"fmt"

	"gorm.io/gorm"
)

type BaseWeights struct {
	gorm.Model
	Squat         float64
	BenchPress    float64
	Deadlift      float64
	OverheadPress float64
}

func BaseWeightForCycle(exercise string, baseweight float64, cycle int) (float64, error) {
	switch exercise {
	case "Squat":
		return baseweight + float64(cycle-1)*5, nil
	case "BenchPress":
		return baseweight + float64(cycle-1)*2.5, nil
	case "Deadlift":
		return baseweight + float64(cycle-1)*5, nil
	case "OverheadPress":
		return baseweight + float64(cycle-1)*2.5, nil
	default:
		return 0, fmt.Errorf("Unknown exercise: %s", exercise)
	}
}
