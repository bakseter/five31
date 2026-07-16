// Package program holds the 5/3/1 domain logic: the fixed four-week wave and
// the pure function that turns a set of training maxes into a full cycle.
// Percentages are Jim Wendler's classic scheme, applied to the Training Max
// (all weights derive from the TM, never the true 1RM). All weights are in
// kilograms and snap to the nearest 2.5 kg.
package program

import (
	"fmt"
	"math"
	"strconv"
	"strings"
)

// LiftMax is the only input the calculator needs per lift.
type LiftMax struct {
	Name        string
	Slug        string
	TrainingMax float64
}

type set struct {
	percent int
	reps    string
	warmup  bool
	amrap   bool
}

// The classic 5/3/1 wave. Three loading weeks + a deload. The final loading set
// of weeks 1–3 is an AMRAP ("+") set — the money set where progress is tracked.
var weeks = []struct {
	name string
	sets []set
}{
	{
		"Week 1 — 5s",
		[]set{
			{40, "5", true, false},
			{50, "5", true, false},
			{60, "3", true, false},
			{65, "5", false, false},
			{75, "5", false, false},
			{85, "5+", false, true},
		},
	},
	{
		"Week 2 — 3s",
		[]set{
			{40, "5", true, false},
			{50, "5", true, false},
			{60, "3", true, false},
			{70, "3", false, false},
			{80, "3", false, false},
			{90, "3+", false, true},
		},
	},
	{
		"Week 3 — 5/3/1",
		[]set{
			{40, "5", true, false},
			{50, "5", true, false},
			{60, "3", true, false},
			{75, "5", false, false},
			{85, "3", false, false},
			{95, "1+", false, true},
		},
	},
	{
		"Week 4 — Deload",
		[]set{
			{40, "5", false, false},
			{50, "5", false, false},
			{60, "5", false, false},
		},
	},
}

// ComputedSet is one prescribed set with its rounded working weight (kg).
type ComputedSet struct {
	Percent int     `json:"percent"`
	Reps    string  `json:"reps"`
	Warmup  bool    `json:"warmup"`
	AMRAP   bool    `json:"amrap"`
	Weight  float64 `json:"weight"`
}

type ComputedLift struct {
	Name        string        `json:"name"`
	Slug        string        `json:"slug"`
	TrainingMax float64       `json:"trainingMax"`
	Sets        []ComputedSet `json:"sets"`
}

type ComputedWeek struct {
	Name  string         `json:"name"`
	Lifts []ComputedLift `json:"lifts"`
}

// Cycle is the full four-week block returned to the client.
type Cycle struct {
	Weeks []ComputedWeek `json:"weeks"`
}

// BuildCycle is pure: same maxes in, same cycle out. No I/O, easy to test.
func BuildCycle(lifts []LiftMax) Cycle {
	c := Cycle{Weeks: make([]ComputedWeek, 0, len(weeks))}
	for _, wk := range weeks {
		cw := ComputedWeek{Name: wk.name, Lifts: make([]ComputedLift, 0, len(lifts))}
		for _, l := range lifts {
			cl := ComputedLift{Name: l.Name, Slug: l.Slug, TrainingMax: l.TrainingMax}
			for _, s := range wk.sets {
				cl.Sets = append(cl.Sets, ComputedSet{
					Percent: s.percent,
					Reps:    s.reps,
					Warmup:  s.warmup,
					AMRAP:   s.amrap,
					Weight:  lowerBound(round(l.TrainingMax * float64(s.percent) / 100)),
				})
			}
			cw.Lifts = append(cw.Lifts, cl)
		}
		c.Weeks = append(c.Weeks, cw)
	}
	return c
}

// round snaps a weight to the smallest loadable increment: 2.5 kg.
func round(w float64) float64 {
	return math.Round(w/2.5) * 2.5
}

func lowerBound(weight float64) float64 {
	return math.Max(weight, 20.0)
}

// ---------------------------------------------------------------------------
// Progression: turn one cycle's AMRAP results into the next cycle's maxes.
//
// Wendler's baseline rule is a fixed per-cycle bump: +2.5 kg on the presses,
// +5 kg on squat & deadlift. On top of that we read the heaviest AMRAP set the
// lifter actually logged and auto-regulate: crush it → bigger jump, miss the
// target → hold. The user can override every number before it's committed, so
// this is a suggestion, never a mandate.
// ---------------------------------------------------------------------------

// Standard per-cycle training-max increments (kg).
const (
	upperInc = 2.5
	lowerInc = 5.0
)

// isLower reports whether a lift trains the lower body (and so earns the bigger
// jump). Derived from the slug, so no extra data is stored.
func isLower(slug string) bool { return slug == "squat" || slug == "deadlift" }

func increment(slug string) float64 {
	if isLower(slug) {
		return lowerInc
	}
	return upperInc
}

// amrapSet is the percent and prescribed-rep target of one week's "+" set.
type amrapSet struct{ percent, target int }

// amrapSets derives the three AMRAP sets (weeks 1–3) straight from the wave, so
// they can never drift out of sync with BuildCycle.
func amrapSets() []amrapSet {
	out := make([]amrapSet, 0, 3)
	for _, wk := range weeks {
		last := wk.sets[len(wk.sets)-1]
		if last.amrap {
			target, _ := strconv.Atoi(strings.TrimSuffix(last.reps, "+"))
			out = append(out, amrapSet{percent: last.percent, target: target})
		}
	}
	return out
}

// LiftResult is one lift's finished cycle: its max and the reps hit on each
// week's AMRAP set (nil where the lifter didn't log anything).
type LiftResult struct {
	Slug        string
	Name        string
	TrainingMax float64
	Reps        [3]*int // weeks 1, 2, 3
}

// Suggestion is the proposed next-cycle max for one lift, with the reasoning
// and an estimated 1RM from the AMRAP set (0 when nothing was logged).
type Suggestion struct {
	Slug               string  `json:"slug"`
	Name               string  `json:"name"`
	CurrentMax         float64 `json:"currentMax"`
	SuggestedMax       float64 `json:"suggestedMax"`
	EstimatedOneRepMax float64 `json:"estimatedOneRepMax"`
	Reason             string  `json:"reason"`
}

// SuggestNext is pure: results in, suggestions out. It bases each lift on the
// heaviest AMRAP set that has a logged value (week 3 beats 2 beats 1), because
// the top set carries the most signal.
func SuggestNext(results []LiftResult) []Suggestion {
	amr := amrapSets()
	out := make([]Suggestion, 0, len(results))

	for _, r := range results {
		inc := increment(r.Slug)
		s := Suggestion{
			Slug:       r.Slug,
			Name:       r.Name,
			CurrentMax: r.TrainingMax,
		}

		// Heaviest logged AMRAP set, searching from week 3 down.
		best := -1
		for i := len(amr) - 1; i >= 0; i-- {
			if i < len(r.Reps) && r.Reps[i] != nil {
				best = i
				break
			}
		}

		switch {
		case best == -1:
			s.SuggestedMax = round(r.TrainingMax + inc)
			s.Reason = "No AMRAP logged — standard progression."
		default:
			reps := *r.Reps[best]
			set := amr[best]
			weight := round(r.TrainingMax * float64(set.percent) / 100)
			if reps > 0 {
				s.EstimatedOneRepMax = round(epley(weight, reps))
			}
			switch {
			case reps <= 0:
				s.SuggestedMax = r.TrainingMax
				s.Reason = "Missed the top set — repeat this max."
			case reps >= set.target+3:
				s.SuggestedMax = round(r.TrainingMax + 2*inc)
				s.Reason = fmt.Sprintf("Strong: %d reps at %d%% — double jump.", reps, set.percent)
			case reps >= set.target:
				s.SuggestedMax = round(r.TrainingMax + inc)
				s.Reason = fmt.Sprintf("Hit target (%d/%d) — standard progression.", reps, set.target)
			default:
				s.SuggestedMax = r.TrainingMax
				s.Reason = fmt.Sprintf("Under target (%d/%d) — hold this max.", reps, set.target)
			}
		}

		out = append(out, s)
	}
	return out
}

// epley estimates a one-rep max from a set: weight × (1 + reps/30).
func epley(weight float64, reps int) float64 {
	return weight * (1 + float64(reps)/30)
}

// EstimateOneRepMax returns an Epley 1RM estimate from the heaviest AMRAP set
// that was logged (with at least one rep) for a completed cycle, or 0 if none
// was logged. Used to chart progress in the history view.
func EstimateOneRepMax(trainingMax float64, reps [3]*int) float64 {
	amr := amrapSets()
	for i := len(amr) - 1; i >= 0; i-- {
		if i < len(reps) && reps[i] != nil && *reps[i] > 0 {
			weight := round(trainingMax * float64(amr[i].percent) / 100)
			return round(epley(weight, *reps[i]))
		}
	}
	return 0
}
