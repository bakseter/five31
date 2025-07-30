package net.bakseter.api

import com.zaxxer.hikari.HikariConfig
import com.zaxxer.hikari.HikariDataSource
import net.bakseter.api.schema.BaseWeights
import net.bakseter.api.schema.BaseWeightsModifier
import net.bakseter.api.schema.Joker
import net.bakseter.api.schema.Workout
import org.flywaydb.core.Flyway
import org.jetbrains.exposed.sql.Database
import org.jetbrains.exposed.sql.SchemaUtils
import org.jetbrains.exposed.sql.Table
import org.jetbrains.exposed.sql.transactions.transaction

val tables: Array<Table> =
    arrayOf(
        Workout,
        BaseWeights,
        Joker,
        BaseWeightsModifier,
    )

class DatabaseHandler(
    private val migrateDb: Boolean,
    private val dbUrl: String,
    private val dbUsername: String,
    private val dbPassword: String,
) {
    private val maxPoolSize = 7

    private fun dataSource(): HikariDataSource =
        HikariDataSource(
            HikariConfig().apply {
                jdbcUrl = dbUrl
                username = dbUsername
                password = dbPassword
                driverClassName = "org.postgresql.Driver"
                connectionTimeout = 1000
                maximumPoolSize = maxPoolSize
            },
        )

    private val flyway: Flyway =
        Flyway
            .configure()
            .baselineOnMigrate(true)
            .baselineVersion("6")
            .cleanDisabled(false)
            .dataSource(dbUrl, dbUsername, dbPassword)
            .load()

    private val conn by lazy {
        Database.connect(dataSource())
    }

    fun init() {
        // Need to use connection once to open.
        transaction(conn) {}

        if (migrateDb) {
            flyway.migrate()
            return
        }

        try {
            transaction { SchemaUtils.create(*tables) }
        } catch (e: Exception) {
            System.err.println("Error creating tables, assuming they already exists.")
        }
    }
}
