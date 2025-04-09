package skeleton

var (
	Cycles    = []int{1, 2, 3, 4}
	Weeks     = []int{1, 2, 3}
	Days      = []int{1, 2, 3, 4}
	Exercises = []string{"Squat", "Bench Press", "Deadlift", "Overhead Press"}
)

type Skeleton struct {
	Cycles    []int
	Weeks     []int
	Days      []int
	Exercises []string
	Metadata  Metadata
}

type Metadata struct {
	CurrentCycle int
	CurrentWeek  int
}
