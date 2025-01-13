import { Client } from 'pg'

const pgClient = new Client({
  host: config.PG.HOST,
  user: config.PG.USER,
  password: config.PG.PASSWORD,
  port: Number(config.PG.PORT),
})

export default pgClient
