package main

import (
	"embed"
	"fmt"
	"html/template"
	"io/fs"
	"os"
	"regexp"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"

	"github.com/bakseter/five31/pkg/models"
	"github.com/bakseter/five31/pkg/routes"
	"github.com/bakseter/five31/pkg/skeleton"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

//go:embed templates/*.html.tmpl
var templates embed.FS

func main() {
	db, err := setupDatabase()
	if err != nil {
		panic(fmt.Errorf("Error setting up database: %v", err))
	}

	router := gin.Default()

	loadHTMLFromEmbedFS(router, templates, "templates/*.html.tmpl")

	router.GET("/", func(c *gin.Context) {
		c.HTML(
			200,
			"templates/index.html.tmpl",
			skeleton.Skeleton{
				Cycles:    skeleton.Cycles,
				Weeks:     skeleton.Weeks,
				Days:      skeleton.Days,
				Exercises: skeleton.Exercises,
				Metadata: skeleton.Metadata{
					CurrentCycle: 1,
					CurrentWeek:  1,
				},
			},
		)
	})

	router.GET("/cycle/:cycle/week/:week", func(c *gin.Context) {
		cycle, err := func() (int, error) {
			cycleStr, found := c.Params.Get("cycle")
			if !found {
				return 1, nil
			}

			cycle_, err := strconv.Atoi(cycleStr)
			if err != nil {
				return 0, fmt.Errorf("Invalid cycle: %v", err)
			}

			return cycle_, nil
		}()
		if err != nil {
			c.String(400, err.Error())
		}

		week, err := func() (int, error) {
			weekStr, found := c.Params.Get("week")
			if !found {
				return 1, nil
			}

			week_, err := strconv.Atoi(weekStr)
			if err != nil {
				return 0, fmt.Errorf("Invalid week: %v", err)
			}

			return week_, nil
		}()
		if err != nil {
			c.String(400, err.Error())
		}

		c.HTML(
			200,
			"templates/index.html.tmpl",
			skeleton.Skeleton{
				Cycles:    skeleton.Cycles,
				Weeks:     skeleton.Weeks,
				Days:      skeleton.Days,
				Exercises: skeleton.Exercises,
				Metadata: skeleton.Metadata{
					CurrentCycle: cycle,
					CurrentWeek:  week,
				},
			},
		)
	})

	router.GET("/status", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status": "ok",
		})
	})

	v1 := router.Group("/api/v1")
	routes.AddWorkoutRoutesV1(v1, db)

	err = router.Run()
	if err != nil {
		fmt.Errorf("Error starting server: %v", err)
	}
}

func setupDatabase() (*gorm.DB, error) {
	dsn := fmt.Sprintf(
		"host=%s user=%s password=%s dbname=%s port=5432 sslmode=disable TimeZone=Europe/Oslo",
		os.Getenv("DATABASE_HOST"),
		os.Getenv("POSTGRES_USER"),
		os.Getenv("POSTGRES_PASSWORD"),
		os.Getenv("POSTGRES_DB"),
	)

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		return nil, err
	}

	// Migrate the schema
	err = db.AutoMigrate(&models.Workout{}, &models.BaseWeights{})
	if err != nil {
		return nil, err
	}

	return db, nil
}

// https://github.com/j1mmyson/LoadHTMLFromEmbedFS-example/blob/main/main.go

func loadHTMLFromEmbedFS(engine *gin.Engine, embedFS embed.FS, pattern string) {
	root := template.New("")
	tmpl := template.Must(root, loadAndAddToRoot(engine.FuncMap, root, embedFS, pattern))

	engine.SetHTMLTemplate(tmpl)
}

func loadAndAddToRoot(funcMap template.FuncMap, rootTemplate *template.Template, embedFS embed.FS, pattern string) error {
	pattern = strings.ReplaceAll(pattern, ".", "\\.")
	pattern = strings.ReplaceAll(pattern, "*", ".*")

	err := fs.WalkDir(embedFS, ".", func(path string, d fs.DirEntry, walkErr error) error {
		if walkErr != nil {
			return walkErr
		}

		if matched, _ := regexp.MatchString(pattern, path); !d.IsDir() && matched {
			data, readErr := embedFS.ReadFile(path)
			if readErr != nil {
				return readErr
			}

			t := rootTemplate.New(path).Funcs(funcMap)
			if _, parseErr := t.Parse(string(data)); parseErr != nil {
				return parseErr
			}
		}

		return nil
	})

	return err
}
