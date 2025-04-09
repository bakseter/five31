package routes

import (
	"fmt"
	"net/http"
	"strconv"

	"github.com/bakseter/five31/pkg/models"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type WorkoutTemplate struct {
	Cycle    int
	Week     int
	Day      int
	Exercise string
	Warmups  []RepsPercentWeight
	MainSets []RepsPercentWeight
}

func workoutModelToWorkoutTemplate(model models.Workout, baseweight float64) (WorkoutTemplate, error) {
	baseWeightForCycle, err := models.BaseWeightForCycle(model.Exercise, baseweight, model.Cycle)
	if err != nil {
		return WorkoutTemplate{}, fmt.Errorf("Error getting base weight for cycle: %v", err)
	}

	mainSets, err := weekNMainSetsWithWeight(model.Week, baseWeightForCycle)
	if err != nil {
		return WorkoutTemplate{}, fmt.Errorf("Error getting main sets for week: %v", err)
	}

	return WorkoutTemplate{
		Cycle:    model.Cycle,
		Week:     model.Week,
		Day:      model.Day,
		Exercise: model.Exercise,
		Warmups:  defaultWarmupsWithWeight(baseWeightForCycle),
		MainSets: mainSets,
	}, nil
}

func dayToExercise(day int) string {
	switch day {
	case 1:
		return "Squat"
	case 2:
		return "BenchPress"
	case 3:
		return "Deadlift"
	case 4:
		return "OverheadPress"
	default:
		return ""
	}
}

type RepsPercentWeight struct {
	Reps    int
	Percent float64
	Weight  float64
}

func defaultWarmupsWithWeight(weight float64) []RepsPercentWeight {
	return []RepsPercentWeight{
		{Reps: 5, Percent: 40, Weight: weight * 0.4},
		{Reps: 5, Percent: 50, Weight: weight * 0.5},
		{Reps: 3, Percent: 60, Weight: weight * 0.6},
	}
}

func weekNMainSetsWithWeight(n int, weight float64) ([]RepsPercentWeight, error) {
	switch n {
	case 1:
		return week1MainSetsWithWeight(weight), nil
	case 2:
		return week2MainSetsWithWeight(weight), nil
	case 3:
		return week3MainSetsWithWeight(weight), nil
	default:
		return []RepsPercentWeight{}, fmt.Errorf("Unknown week: %d", n)
	}
}

func week1MainSetsWithWeight(weight float64) []RepsPercentWeight {
	return []RepsPercentWeight{
		{Reps: 5, Percent: 65, Weight: weight * 0.65},
		{Reps: 5, Percent: 75, Weight: weight * 0.75},
		{Reps: 5, Percent: 85, Weight: weight * 0.85},
	}
}

func week2MainSetsWithWeight(weight float64) []RepsPercentWeight {
	return []RepsPercentWeight{
		{Reps: 3, Percent: 70, Weight: weight * 0.7},
		{Reps: 3, Percent: 80, Weight: weight * 0.8},
		{Reps: 3, Percent: 90, Weight: weight * 0.9},
	}
}

func week3MainSetsWithWeight(weight float64) []RepsPercentWeight {
	return []RepsPercentWeight{
		{Reps: 5, Percent: 75, Weight: weight * 0.75},
		{Reps: 3, Percent: 85, Weight: weight * 0.85},
		{Reps: 1, Percent: 95, Weight: weight * 0.95},
	}
}

func AddWorkoutRoutesV1(group *gin.RouterGroup, db *gorm.DB) {
	group.GET("/workout",
		func(c *gin.Context) {
			cycle, err := strconv.Atoi(c.Query("cycle"))
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			}

			week, err := strconv.Atoi(c.Query("week"))
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			}

			day, err := strconv.Atoi(c.Query("day"))
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			}

			var workout models.Workout

			err = db.Where("cycle = ? AND week = ? AND day = ?", cycle, week, day).First(&workout).Error
			if err != nil {
				if err == gorm.ErrRecordNotFound {
					mainSets, err := weekNMainSetsWithWeight(week, 0)
					if err != nil {
						c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})

						return
					}

					c.HTML(http.StatusOK, "templates/workout.html.tmpl", WorkoutTemplate{
						Cycle:    cycle,
						Week:     week,
						Day:      day,
						Exercise: dayToExercise(day),
						Warmups:  defaultWarmupsWithWeight(0),
						MainSets: mainSets,
					})

					return
				} else {
					c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})

					return
				}
			}

			var baseWeights models.BaseWeights

			err = db.Find(&baseWeights).Error
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})

				return
			}

			baseWeightForExercise, err := func() (float64, error) {
				switch workout.Exercise {
				case "Squat":
					return baseWeights.Squat, nil
				case "BenchPress":
					return baseWeights.BenchPress, nil
				case "Deadlift":
					return baseWeights.Deadlift, nil
				case "OverheadPress":
					return baseWeights.OverheadPress, nil
				default:
					return 0, fmt.Errorf("Unknown exercise: %s", workout.Exercise)
				}
			}()

			baseWeightForCycle, err := models.BaseWeightForCycle(workout.Exercise, baseWeightForExercise, workout.Cycle)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})

				return
			}

			workoutTemplate, err := workoutModelToWorkoutTemplate(
				workout,
				baseWeightForCycle,
			)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})

				return
			}

			c.HTML(
				http.StatusOK,
				"templates/workout.html.tmpl",
				workoutTemplate,
			)
		},
	)

	group.GET("/workouts",
		func(c *gin.Context) {
			cycle, err := strconv.Atoi(c.Query("cycle"))
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			}

			var workouts []models.Workout

			err = db.Where("cycle = ?", cycle).Find(&workouts).Error
			if err != nil {
				c.HTML(http.StatusNotFound, "404.html", nil)

				return
			}

			var baseWeights models.BaseWeights

			err = db.Find(&baseWeights).Error
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			}

			c.HTML(
				http.StatusOK,
				"templates/workout.html.tmpl",
				gin.H{"WorkoutsWithBaseWeights": workouts},
			)
		},
	)

	group.POST("/workout",
		func(c *gin.Context) {
			var workout models.Workout

			err := c.BindJSON(&workout)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}

			err = db.Create(&workout).Error
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}

			c.JSON(http.StatusOK, workout)
		},
	)
}
