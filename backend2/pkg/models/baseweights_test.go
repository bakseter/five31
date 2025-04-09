package models_test

import (
	"fmt"
	"testing"

	"github.com/bakseter/five31/pkg/models"
)

func TestBaseWeightForCycle(t *testing.T) {
	t.Parallel()

	tests := []struct {
		exercise   string
		baseweight float64
		cycle      int
		expected   float64
	}{
		{"Squat", 100, 1, 100},
		{"Squat", 100, 2, 105},
		{"Squat", 100, 3, 110},
		{"BenchPress", 100, 1, 100},
		{"BenchPress", 100, 2, 102.5},
		{"BenchPress", 100, 3, 105},
		{"Deadlift", 100, 1, 100},
		{"Deadlift", 100, 2, 105},
		{"Deadlift", 100, 3, 110},
		{"OverheadPress", 100, 1, 100},
		{"OverheadPress", 100, 2, 102.5},
		{"OverheadPress", 100, 3, 105},
	}

	for _, test := range tests {
		t.Run(fmt.Sprintf("%s %d", test.exercise, test.cycle), func(t *testing.T) {
			t.Parallel()
			actual, err := models.BaseWeightForCycle(test.exercise, test.baseweight, test.cycle)
			if err != nil {
				t.Fatalf("Unexpected error: %v", err)
			}
			if actual != test.expected {
				t.Errorf("Expected %f, got %f", test.expected, actual)
			}
		})
	}
}

func TestBaseWeightsForCycleInvalidExercise(t *testing.T) {
	t.Parallel()

	_, err := models.BaseWeightForCycle("Invalid", 100, 1)
	if err == nil {
		t.Error("Expected error, got nil")
	}
}
