import { Client } from 'pg'
import { PG_HOST, PG_PASSWORD, PG_PORT, PG_USER } from '../../config'
import dbClient from './db-prisma'

const pgClient = new Client({
  host: PG_HOST,
  user: PG_USER,
  password: PG_PASSWORD,
  port: Number(PG_PORT),
})

export default pgClient
