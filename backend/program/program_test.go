package program

import "testing"

func TestBuildCycle(t *testing.T) {
	c := BuildCycle([]LiftMax{{Name: "Squat", Slug: "squat", TrainingMax: 100, Unit: "kg"}})

	if len(c.Weeks) != 4 {
		t.Fatalf("want 4 weeks, got %d", len(c.Weeks))
	}
	if c.Unit != "kg" {
		t.Fatalf("want unit kg, got %s", c.Unit)
	}

	// Week 1 top set: 85% of 100 = 85, and it must be the AMRAP set.
	top := c.Weeks[0].Lifts[0].Sets[2]
	if top.Weight != 85 || !top.AMRAP || top.Reps != "5+" {
		t.Fatalf("week1 top set wrong: %+v", top)
	}

	// Rounding: 65% of 100 = 65 (already on the 2.5 grid).
	if got := c.Weeks[0].Lifts[0].Sets[0].Weight; got != 65 {
		t.Fatalf("want 65, got %v", got)
	}
}

func TestRoundingLb(t *testing.T) {
	// 65% of 130 lb = 84.5 → rounds to nearest 5 → 85.
	if got := round(84.5, "lb"); got != 85 {
		t.Fatalf("want 85, got %v", got)
	}
	// kg rounds to nearest 2.5: 84.5 → 85.
	if got := round(84.5, "kg"); got != 85 {
		t.Fatalf("want 85, got %v", got)
	}
	// 61 kg → nearest 2.5 → 60.
	if got := round(61, "kg"); got != 60 {
		t.Fatalf("want 60, got %v", got)
	}
}

func intp(n int) *int { return &n }

func TestSuggestNext(t *testing.T) {
	reps := func(a, b, c *int) [3]*int { return [3]*int{a, b, c} }

	cases := []struct {
		name string
		in   LiftResult
		want float64
	}{
		{
			// Upper lift, nothing logged → +2.5 kg standard bump.
			name: "no log upper",
			in:   LiftResult{Slug: "bench", TrainingMax: 100, Unit: "kg"},
			want: 102.5,
		},
		{
			// Lower lift hits the target single → +5 kg standard bump.
			name: "hit target lower",
			in:   LiftResult{Slug: "squat", TrainingMax: 140, Unit: "kg", Reps: reps(nil, nil, intp(1))},
			want: 145,
		},
		{
			// Crushed the top single (1+ target is 1, got 5 ≥ 1+3) → double jump.
			name: "crushed lower",
			in:   LiftResult{Slug: "deadlift", TrainingMax: 180, Unit: "kg", Reps: reps(nil, nil, intp(5))},
			want: 190,
		},
		{
			// Missed the top set → hold the max.
			name: "missed top",
			in:   LiftResult{Slug: "press", TrainingMax: 60, Unit: "kg", Reps: reps(nil, nil, intp(0))},
			want: 60,
		},
	}

	for _, tc := range cases {
		got := SuggestNext([]LiftResult{tc.in})
		if len(got) != 1 {
			t.Fatalf("%s: want 1 suggestion, got %d", tc.name, len(got))
		}
		if got[0].SuggestedMax != tc.want {
			t.Fatalf("%s: want %v, got %v (%s)", tc.name, tc.want, got[0].SuggestedMax, got[0].Reason)
		}
	}
}

func TestEstimateOneRepMax(t *testing.T) {
	// Nothing logged → 0.
	if got := EstimateOneRepMax(100, "kg", [3]*int{nil, nil, nil}); got != 0 {
		t.Fatalf("want 0, got %v", got)
	}
	// Week 3 (95%) of TM 100 = 95 kg for 3 reps → Epley 95×(1+3/30)=104.5 → 105 (2.5 grid).
	if got := EstimateOneRepMax(100, "kg", [3]*int{nil, nil, intp(3)}); got != 105 {
		t.Fatalf("want 105, got %v", got)
	}
	// Only week 1 (85%) logged: 85 kg for 5 → 85×(1+5/30)=99.16 → 100.
	if got := EstimateOneRepMax(100, "kg", [3]*int{intp(5), nil, nil}); got != 100 {
		t.Fatalf("want 100, got %v", got)
	}
}
