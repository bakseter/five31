package net.bakseter.api.routes.v1

import io.ktor.http.HttpStatusCode
import io.ktor.server.application.call
import io.ktor.server.auth.authenticate
import io.ktor.server.auth.jwt.JWTPrincipal
import io.ktor.server.auth.principal
import io.ktor.server.request.receive
import io.ktor.server.response.respond
import io.ktor.server.routing.Route
import io.ktor.server.routing.get
import io.ktor.server.routing.put
import net.bakseter.api.schema.DateJson
import net.bakseter.api.schema.Workout
import net.bakseter.api.schema.WorkoutCountJson
import net.bakseter.api.schema.WorkoutJson
import org.jetbrains.exposed.sql.and
import org.jetbrains.exposed.sql.insert
import org.jetbrains.exposed.sql.selectAll
import org.jetbrains.exposed.sql.transactions.transaction
import org.jetbrains.exposed.sql.update
import org.joda.time.DateTime

fun Route.workoutRoutesV1(authConfig: String) {
    authenticate(authConfig) {
        getWorkoutV1()
        putWorkoutV1()
        getDateV1()
        putDateV1()
        getWorkoutCountV1()
    }
}

fun Route.getWorkoutV1() {
    get("/workout") {
        val email =
            call
                .principal<JWTPrincipal>()
                ?.payload
                ?.getClaim("email")
                ?.asString()
                ?.lowercase()
        if (email == null) {
            call.respond(HttpStatusCode.Unauthorized)
            return@get
        }

        val profile = call.request.queryParameters["profile"]?.toIntOrNull()
        val cycle = call.request.queryParameters["cycle"]?.toIntOrNull()
        val week = call.request.queryParameters["week"]?.toIntOrNull()
        val day = call.request.queryParameters["day"]?.toIntOrNull()

        if (profile == null || cycle == null || week == null || day == null) {
            call.respond(HttpStatusCode.BadRequest)
            return@get
        }

        val workout =
            transaction {
                Workout
                    .selectAll()
                    .where {
                        Workout.email eq email and
                            (
                                Workout.profile eq profile and
                                    (
                                        Workout.cycle eq cycle and
                                            (
                                                Workout.week eq week and
                                                    (Workout.day eq day)
                                            )
                                    )
                            )
                    }.firstOrNull()
            }

        if (workout == null) {
            call.respond(HttpStatusCode.NoContent)
            return@get
        }

        call.respond(
            HttpStatusCode.OK,
            WorkoutJson(
                cycle = workout[Workout.cycle],
                week = workout[Workout.week],
                day = workout[Workout.day],
                reps = workout[Workout.reps],
            ),
        )
    }
}

fun Route.putWorkoutV1() {
    put("/workout") {
        val email =
            call
                .principal<JWTPrincipal>()
                ?.payload
                ?.getClaim("email")
                ?.asString()
                ?.lowercase()
        if (email == null) {
            call.respond(HttpStatusCode.Unauthorized)
            return@put
        }

        val profile = call.request.queryParameters["profile"]?.toIntOrNull()
        if (profile == null) {
            call.respond(HttpStatusCode.BadRequest)
            return@put
        }

        try {
            val workoutJson = call.receive<WorkoutJson>()

            val workout =
                transaction {
                    Workout
                        .selectAll()
                        .where {
                            Workout.cycle eq workoutJson.cycle and
                                (
                                    Workout.profile eq profile and
                                        (
                                            Workout.week eq workoutJson.week and
                                                (Workout.day eq workoutJson.day)
                                        )
                                )
                        }.firstOrNull()
                }

            if (workout == null) {
                transaction {
                    Workout.insert {
                        it[Workout.email] = email
                        it[Workout.profile] = profile
                        it[cycle] = workoutJson.cycle
                        it[week] = workoutJson.week
                        it[day] = workoutJson.day
                        it[reps] = workoutJson.reps
                    }
                }

                call.respond(HttpStatusCode.OK)
                return@put
            }

            transaction {
                Workout.update({
                    Workout.cycle eq workoutJson.cycle and
                        (
                            Workout.profile eq profile and
                                (
                                    Workout.week eq workoutJson.week and
                                        (Workout.day eq workoutJson.day)
                                )
                        )
                }) {
                    it[reps] = workoutJson.reps
                }
            }

            call.respond(HttpStatusCode.Accepted)
        } catch (e: Exception) {
            e.printStackTrace()
            call.respond(HttpStatusCode.InternalServerError)
        }
    }
}

fun Route.putDateV1() {
    put("/workout/date") {
        val email =
            call
                .principal<JWTPrincipal>()
                ?.payload
                ?.getClaim("email")
                ?.asString()
                ?.lowercase()
        if (email == null) {
            call.respond(HttpStatusCode.Unauthorized)
            return@put
        }

        val profile = call.request.queryParameters["profile"]?.toIntOrNull()
        val cycle = call.request.queryParameters["cycle"]?.toIntOrNull()
        val week = call.request.queryParameters["week"]?.toIntOrNull()
        val day = call.request.queryParameters["day"]?.toIntOrNull()

        if (profile == null || cycle == null || week == null || day == null) {
            call.respond(HttpStatusCode.BadRequest)
            return@put
        }

        try {
            val dateJson = call.receive<DateJson>()

            val workout =
                transaction {
                    Workout
                        .selectAll()
                        .where {
                            Workout.email eq email and
                                (
                                    Workout.profile eq profile and
                                        (
                                            Workout.cycle eq cycle and
                                                (
                                                    Workout.week eq week and
                                                        (Workout.day eq day)
                                                )
                                        )
                                )
                        }.firstOrNull()
                }

            if (workout == null) {
                transaction {
                    Workout.insert {
                        it[Workout.email] = email
                        it[Workout.profile] = profile
                        it[Workout.cycle] = cycle
                        it[Workout.week] = week
                        it[Workout.day] = day
                        it[Workout.date] = DateTime(dateJson.date)
                    }
                }

                call.respond(HttpStatusCode.OK)
                return@put
            }

            transaction {
                Workout.update({
                    Workout.email eq email and
                        (
                            Workout.profile eq profile and
                                (
                                    Workout.cycle eq cycle and
                                        (
                                            Workout.week eq week and
                                                (Workout.day eq day)
                                        )
                                )
                        )
                }) {
                    it[date] = DateTime(dateJson.date)
                }
            }

            call.respond(HttpStatusCode.Accepted)
        } catch (e: Exception) {
            e.printStackTrace()
            call.respond(HttpStatusCode.InternalServerError)
        }
    }
}

fun Route.getDateV1() {
    get("/workout/date") {
        val email =
            call
                .principal<JWTPrincipal>()
                ?.payload
                ?.getClaim("email")
                ?.asString()
                ?.lowercase()
        if (email == null) {
            call.respond(HttpStatusCode.Unauthorized)
            return@get
        }

        val profile = call.request.queryParameters["profile"]?.toIntOrNull()
        val cycle = call.request.queryParameters["cycle"]?.toIntOrNull()
        val week = call.request.queryParameters["week"]?.toIntOrNull()
        val day = call.request.queryParameters["day"]?.toIntOrNull()

        if (profile == null || cycle == null || week == null || day == null) {
            call.respond(HttpStatusCode.BadRequest)
            return@get
        }

        val workout =
            transaction {
                Workout
                    .selectAll()
                    .where {
                        Workout.email eq email and
                            (
                                Workout.profile eq profile and
                                    (
                                        Workout.cycle eq cycle and
                                            (
                                                Workout.week eq week and
                                                    (Workout.day eq day)
                                            )
                                    )
                            )
                    }.firstOrNull()
            }

        val date = workout?.get(Workout.date)

        if (date == null) {
            call.respond(HttpStatusCode.NoContent)
            return@get
        }

        call.respond(
            HttpStatusCode.OK,
            DateJson(date.toString()),
        )
    }
}

fun Route.getWorkoutCountV1() {
    get("/workout/count") {
        val email =
            call
                .principal<JWTPrincipal>()
                ?.payload
                ?.getClaim("email")
                ?.asString()
                ?.lowercase()
        if (email == null) {
            call.respond(HttpStatusCode.Unauthorized)
            return@get
        }

        val profile = call.request.queryParameters["profile"]?.toIntOrNull()
        if (profile == null) {
            call.respond(HttpStatusCode.BadRequest)
            return@get
        }

        val count =
            transaction {
                Workout
                    .selectAll()
                    .where { Workout.email eq email and (Workout.profile eq profile) }
                    .count()
                    .toInt()
            }

        call.respond(
            HttpStatusCode.OK,
            WorkoutCountJson(count),
        )
    }
}
