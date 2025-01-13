// config.ts
import dotenv from 'dotenv'
dotenv.config()

export const REDIS_HOST = process.env.REDIS_HOST
export const REDIS_PORT = process.env.REDIS_PORT
export const REDIS_PASSWORD = process.env.REDIS_PASSWORD

export const AWS_ACCOUNT_ID = process.env.AWS_ACCOUNT_ID
export const AWS_REGION = process.env.AWS_REGION
export const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID
export const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY

export const PG_HOST = process.env.PG_HOST
export const PG_PORT = process.env.PG_PORT
export const PG_USER = process.env.PG_USER
export const PG_PASSWORD = process.env.PG_PASSWORD

export const ENABLE_LOGGING = process.env.ENABLE_LOGGING === 'true'

export const CHAIN_ID = process.env.CHAIN_ID
export const RPC_URL = process.env.RPC_URL

export const ADDRESS_ZERO = '0x0000000000000000000000000000000000000000'
