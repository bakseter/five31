package net.bakseter.api.routes.v2

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
import net.bakseter.api.schema.BaseWeights
import net.bakseter.api.schema.BaseWeightsJson
import net.bakseter.api.schema.BaseWeightsModifier
import net.bakseter.api.schema.BaseWeightsModifierJson
import org.jetbrains.exposed.sql.and
import org.jetbrains.exposed.sql.insert
import org.jetbrains.exposed.sql.selectAll
import org.jetbrains.exposed.sql.transactions.transaction
import org.jetbrains.exposed.sql.update

fun Route.baseWeightsRoutesV2(authConfig: String) {
    authenticate(authConfig) {
        getBaseWeightsV2()
        putBaseWeightsV2()
        getBaseWeightsModifierV2()
        putBaseWeightsModifierV2()
    }
}

fun Route.getBaseWeightsV2() {
    get("/base-weights") {
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

        val baseWeights =
            transaction {
                BaseWeights.selectAll().where { BaseWeights.email eq email and (BaseWeights.profile eq profile) }.firstOrNull()
            }

        if (baseWeights == null) {
            call.respond(HttpStatusCode.NoContent)
            return@get
        }

        call.respond(
            HttpStatusCode.OK,
            BaseWeightsJson(
                dl = baseWeights[BaseWeights.dl],
                bp = baseWeights[BaseWeights.bp],
                sq = baseWeights[BaseWeights.sq],
                op = baseWeights[BaseWeights.op],
            ),
        )
    }
}

fun Route.putBaseWeightsV2() {
    put("/base-weights") {
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
            val baseWeightsJson = call.receive<BaseWeightsJson>()

            val baseWeights =
                transaction {
                    BaseWeights.selectAll().where { BaseWeights.email eq email and (BaseWeights.profile eq profile) }.firstOrNull()
                }

            if (baseWeights == null) {
                transaction {
                    BaseWeights.insert {
                        it[BaseWeights.email] = email
                        it[BaseWeights.profile] = profile
                        it[dl] = baseWeightsJson.dl
                        it[bp] = baseWeightsJson.bp
                        it[sq] = baseWeightsJson.sq
                        it[op] = baseWeightsJson.op
                    }
                }

                call.respond(HttpStatusCode.OK)
                return@put
            }

            transaction {
                BaseWeights.update({ BaseWeights.email eq email and (BaseWeights.profile eq profile) }) {
                    it[dl] = baseWeightsJson.dl
                    it[bp] = baseWeightsJson.bp
                    it[sq] = baseWeightsJson.sq
                    it[op] = baseWeightsJson.op
                }
            }

            call.respond(HttpStatusCode.Accepted)
        } catch (e: Exception) {
            e.printStackTrace()
            call.respond(HttpStatusCode.InternalServerError)
        }
    }
}

fun Route.getBaseWeightsModifierV2() {
    get("/base-weights/modifier/{cycle}") {
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
        val cycle = call.parameters["cycle"]?.toIntOrNull()

        if (profile == null || cycle == null) {
            call.respond(HttpStatusCode.BadRequest)
            return@get
        }

        val mod =
            transaction {
                BaseWeightsModifier
                    .selectAll()
                    .where {
                        BaseWeightsModifier.email eq email and
                            (
                                BaseWeightsModifier.profile eq profile and
                                    (BaseWeightsModifier.cycle eq cycle)
                            )
                    }.firstOrNull()
            }

        if (mod == null) {
            call.respond(HttpStatusCode.NoContent)
            return@get
        }

        call.respond(
            BaseWeightsModifierJson(
                cycle = mod[BaseWeightsModifier.cycle],
                dl = mod[BaseWeightsModifier.dl],
                bp = mod[BaseWeightsModifier.bp],
                sq = mod[BaseWeightsModifier.sq],
                op = mod[BaseWeightsModifier.op],
            ),
        )
    }
}

fun Route.putBaseWeightsModifierV2() {
    put("/base-weights/modifier") {
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
            val baseWeightsModJson = call.receive<BaseWeightsModifierJson>()

            val baseWeightsMod =
                transaction {
                    BaseWeightsModifier
                        .selectAll()
                        .where {
                            BaseWeightsModifier.email eq email and
                                (
                                    BaseWeightsModifier.profile eq profile and
                                        (BaseWeightsModifier.cycle eq baseWeightsModJson.cycle)
                                )
                        }.firstOrNull()
                }

            if (baseWeightsMod == null) {
                transaction {
                    BaseWeightsModifier.insert {
                        it[BaseWeightsModifier.email] = email
                        it[BaseWeightsModifier.profile] = profile
                        it[cycle] = baseWeightsModJson.cycle
                        it[dl] = baseWeightsModJson.dl
                        it[bp] = baseWeightsModJson.bp
                        it[sq] = baseWeightsModJson.sq
                        it[op] = baseWeightsModJson.op
                    }
                }

                call.respond(HttpStatusCode.OK)
                return@put
            }

            transaction {
                BaseWeightsModifier.update({
                    BaseWeightsModifier.email eq email and
                        (
                            BaseWeightsModifier.profile eq profile and
                                (BaseWeightsModifier.cycle eq baseWeightsModJson.cycle)
                        )
                }) {
                    it[dl] = baseWeightsModJson.dl
                    it[bp] = baseWeightsModJson.bp
                    it[sq] = baseWeightsModJson.sq
                    it[op] = baseWeightsModJson.op
                }
            }

            call.respond(HttpStatusCode.Accepted)
        } catch (e: Exception) {
            e.printStackTrace()
            call.respond(HttpStatusCode.InternalServerError)
        }
    }
}
