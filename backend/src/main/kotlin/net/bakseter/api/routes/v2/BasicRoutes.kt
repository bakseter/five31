package net.bakseter.api.routes.v2

import com.auth0.jwt.JWT
import com.auth0.jwt.algorithms.Algorithm
import io.ktor.http.HttpStatusCode
import io.ktor.server.application.call
import io.ktor.server.response.respond
import io.ktor.server.routing.Route
import io.ktor.server.routing.get
import java.util.Date

fun Route.basicRoutesV2(
    dev: Boolean,
    secret: String,
    audience: String,
    issuer: String,
) {
    getStatusV2()
    getTokenV2(dev = dev, secret = secret, audience = audience, issuer = issuer)
}

fun Route.getStatusV2() {
    get("/status") { call.respond(HttpStatusCode.OK) }
}

fun Route.getTokenV2(
    dev: Boolean,
    secret: String,
    audience: String,
    issuer: String,
) {
    get("/token/{email}") {
        if (!dev) {
            call.respond(HttpStatusCode.Forbidden, "Only available in dev environment! >:(")
            return@get
        }

        val email = call.parameters["email"]

        if (email == null) {
            call.respond(HttpStatusCode.BadRequest, "No email supplied")
            return@get
        }

        val token =
            JWT
                .create()
                .withAudience(audience)
                .withIssuer(issuer)
                .withClaim("email", email)
                .withExpiresAt(Date(System.currentTimeMillis() + (1000 * 60 * 60)))
                .sign(Algorithm.HMAC256(secret))

        call.respond(token)
    }
}
