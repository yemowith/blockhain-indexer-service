import pgClient from '@/core/clients/db-pg'
import fs from 'fs/promises'
import { Client } from 'pg'
import { config } from '@/config'
import cacheProvider from './cacheProvider'

const dbPgProvider = {
  createDatabase: async (databaseName: string) => {
    try {
      // Check if the database already exists
      const checkDbExistsQuery = `SELECT 1 FROM pg_database WHERE datname = '${databaseName}'`
      const result = await pgClient.query(checkDbExistsQuery)

      if (result.rowCount === 0) {
        // Create the database
        await pgClient.query(`CREATE DATABASE ${databaseName}`)
      } else {
        console.log(`Database "${databaseName}" already exists.`)
      }
    } catch (error) {
      console.error('Error creating database:', error)
    } finally {
    }
  },
  removeDatabase: async (databaseName: string) => {
    try {
      await pgClient.query(`DROP DATABASE ${databaseName}`)
    } catch (error) {
      console.error('Error removing database:', error)
    } finally {
    }
  },
  executeSqlFromFile: async (dbName: string) => {
    let filePath: string = 'data/container-db/migration.sql'

    let customPgClient = new Client({
      host: config.PG.HOST,
      user: config.PG.USER,
      password: config.PG.PASSWORD,
      port: Number(config.PG.PORT),
      database: dbName,
    })

    try {
      await customPgClient.connect()

      // Read SQL file content
      const sqlContent = await fs.readFile(filePath, 'utf-8')

      // Execute SQL content
      await customPgClient.query(sqlContent)
      console.log('SQL file executed successfully.')
    } catch (error) {
      console.error('Error executing SQL file:', error)
    } finally {
      await customPgClient.end()
    }
  },
  listAllDatabases: async () => {
    try {
      const result = await pgClient.query(
        'SELECT datname FROM pg_database WHERE datistemplate = false',
      )
      const databases = result.rows.map((row) => row.datname)
      console.log('Databases:', databases)
      return databases
    } catch (error) {
      console.error('Error listing databases:', error)
      return []
    } finally {
    }
  },
  deleteDatabasesWithPrefix: async (prefix: string, force: boolean = true) => {
    try {
      const result = await pgClient.query(
        'SELECT datname FROM pg_database WHERE datistemplate = false',
      )
      const databasesToDelete = result.rows
        .map((row) => row.datname)
        .filter((name) => name.startsWith(prefix))

      for (const dbName of databasesToDelete) {
        try {
          if (force) {
            // Terminate all connections to the database
            await pgClient.query(`
              SELECT pg_terminate_backend(pg_stat_activity.pid)
              FROM pg_stat_activity
              WHERE pg_stat_activity.datname = '${dbName}' 
              AND pid <> pg_backend_pid();
            `)
            console.log(
              `All connections to database "${dbName}" have been terminated.`,
            )
          }
          await pgClient.query(`DROP DATABASE ${dbName}`)
          console.log(`Database "${dbName}" has been deleted.`)
        } catch (error) {
          console.error(`Error deleting database "${dbName}":`, error)
        }
      }
    } catch (error) {
      console.error('Error deleting databases with prefix:', error)
    } finally {
      await pgClient.end()
    }
  },

  getByDBPrefix: async (prefix: string = 'c_') => {
    // Get all databases with the given prefix
    const result = await pgClient.query(
      'SELECT datname FROM pg_database WHERE datistemplate = false',
    )

    const databasesToCheck = result.rows
      .map((row) => row.datname)
      .filter((name) => name.startsWith(prefix))

    console.log(`Databases matching prefix "${prefix}":`, databasesToCheck)

    return databasesToCheck
  },
  getWalletETHCount: async (prefix: string = 'c_') => {
    let dbs = await dbPgProvider.getByDBPrefix(prefix)
    let result: any = {
      total: 0,
      db: [],
    }

    if (dbs.length === 0) {
      return result
    } else {
      for (const db of dbs) {
        let cache = await cacheProvider.get(`${db}-walletCount`)
        if (cache) {
          result.total += parseInt(cache as string)
          result.db.push({
            dbName: db,
            count: cache,
          })
          continue
        }

        let customPgClient = new Client({
          host: config.PG.HOST,
          user: config.PG.USER,
          password: config.PG.PASSWORD,
          port: Number(config.PG.PORT),
          database: db,
        })
        await customPgClient.connect()

        const sqlResult = await customPgClient.query(
          `SELECT COUNT(*) FROM "WalletETH"`,
        )
        result.total += parseInt(sqlResult.rows[0].count)
        result.db.push({
          dbName: db,
          count: sqlResult.rows[0].count,
        })
        await cacheProvider.set(
          `${db}-walletCount`,
          sqlResult.rows[0].count,
          10000,
        )
        await customPgClient.end()
      }
      return result
    }
  },
}

export default dbPgProvider
