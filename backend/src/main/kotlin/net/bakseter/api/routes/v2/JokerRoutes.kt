package net.bakseter.api.routes.v2

import io.ktor.http.HttpStatusCode
import io.ktor.server.application.call
import io.ktor.server.auth.authenticate
import io.ktor.server.auth.jwt.JWTPrincipal
import io.ktor.server.auth.principal
import io.ktor.server.response.respond
import io.ktor.server.routing.Route
import io.ktor.server.routing.get
import io.ktor.server.routing.put
import net.bakseter.api.schema.Joker
import net.bakseter.api.schema.JokerCount
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import org.jetbrains.exposed.sql.and
import org.jetbrains.exposed.sql.deleteWhere
import org.jetbrains.exposed.sql.insert
import org.jetbrains.exposed.sql.selectAll
import org.jetbrains.exposed.sql.transactions.transaction

fun Route.jokerRoutesV2(authConfig: String) {
    authenticate(authConfig) {
        getJokerV2()
        putJokerV2()
        getJokerAmountV2()
    }
}

fun Route.getJokerV2() {
    get("/joker/{num}") {
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
        val num = call.parameters["num"]?.toIntOrNull()
        val cycle = call.request.queryParameters["cycle"]?.toIntOrNull()
        val week = call.request.queryParameters["week"]?.toIntOrNull()
        val day = call.request.queryParameters["day"]?.toIntOrNull()

        if (profile == null || num == null || cycle == null || week == null || day == null) {
            call.respond(HttpStatusCode.BadRequest)
            return@get
        }

        val joker =
            transaction {
                Joker
                    .selectAll()
                    .where {
                        Joker.email eq email and
                            (
                                Joker.profile eq profile and
                                    (
                                        Joker.cycle eq cycle and
                                            (
                                                Joker.week eq week and
                                                    (
                                                        Joker.day eq day and
                                                            (Joker.num eq num)
                                                    )
                                            )
                                    )
                            )
                    }.firstOrNull()
            }

        if (joker == null) {
            call.respond(HttpStatusCode.NoContent)
            return@get
        }

        call.respond(HttpStatusCode.OK)
    }
}

fun Route.putJokerV2() {
    put("/joker/{num}") {
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
        val num = call.parameters["num"]?.toIntOrNull()
        val cycle = call.request.queryParameters["cycle"]?.toIntOrNull()
        val week = call.request.queryParameters["week"]?.toIntOrNull()
        val day = call.request.queryParameters["day"]?.toIntOrNull()

        if (profile == null || num == null || cycle == null || week == null || day == null) {
            call.respond(HttpStatusCode.BadRequest)
            return@put
        }

        val joker =
            transaction {
                Joker
                    .selectAll()
                    .where {
                        Joker.email eq email and
                            (
                                Joker.profile eq profile and
                                    (
                                        Joker.cycle eq cycle and
                                            (
                                                Joker.week eq week and
                                                    (
                                                        Joker.day eq day and
                                                            (Joker.num eq num)
                                                    )
                                            )
                                    )
                            )
                    }.firstOrNull()
            }

        if (joker == null) {
            transaction {
                Joker.insert {
                    it[Joker.email] = email
                    it[Joker.profile] = profile
                    it[Joker.cycle] = cycle
                    it[Joker.week] = week
                    it[Joker.day] = day
                    it[Joker.num] = num
                }
            }

            call.respond(HttpStatusCode.OK)
            return@put
        }

        transaction {
            Joker.deleteWhere {
                Joker.email eq email and
                    (
                        Joker.profile eq profile and
                            (
                                Joker.cycle eq cycle and
                                    (
                                        Joker.week eq week and
                                            (
                                                Joker.day eq day and
                                                    (Joker.num eq num)
                                            )
                                    )
                            )
                    )
            }
        }

        call.respond(HttpStatusCode.OK)
    }
}

fun Route.getJokerAmountV2() {
    get("/joker/count") {
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

        val count =
            transaction {
                Joker
                    .selectAll()
                    .where {
                        Joker.email eq email and
                            (
                                Joker.profile eq profile and
                                    (
                                        Joker.cycle eq cycle and
                                            (
                                                Joker.week eq week and
                                                    (Joker.day eq day)
                                            )
                                    )
                            )
                    }.count()
            }.toInt()

        call.respond(HttpStatusCode.OK, JokerCount(count))
    }
}
