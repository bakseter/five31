package net.bakseter.api

import io.ktor.server.application.Application
import io.ktor.server.netty.EngineMain
import net.bakseter.api.plugins.configureAuthentication
import net.bakseter.api.plugins.configureCORS
import net.bakseter.api.plugins.configureContentNegotiation
import net.bakseter.api.plugins.configureRateLimit
import net.bakseter.api.plugins.configureRouting

fun main(args: Array<String>) {
    EngineMain.main(args)
}

fun Application.module() {
    val databaseUrl = environment.config.property("ktor.databaseUrl").getString()
    val databaseUsername = environment.config.property("ktor.databaseUsername").getString()
    val databasePassword = environment.config.property("ktor.databasePassword").getString()

    val migrateDb = environment.config.property("ktor.migrateDb").getString().toBooleanStrict()
    val dev = environment.config.property("ktor.dev").getString().toBooleanStrict()

    val devSecret = environment.config.property("jwt.devSecret").getString()
    val devAudience = environment.config.property("jwt.devAudience").getString()
    val devIssuer = environment.config.property("jwt.devIssuer").getString()

    DatabaseHandler(
        migrateDb,
        databaseUrl,
        databaseUsername,
        databasePassword,
    ).init()

    configureAuthentication(devSecret = devSecret, devAudience = devAudience, devIssuer = devIssuer)
    configureCORS(dev = dev)
    configureContentNegotiation()
    configureRouting(dev = dev, devSecret = devSecret, devAudience = devAudience, devIssuer = devIssuer)
    // configureDocumentation()
    configureRateLimit()
}
