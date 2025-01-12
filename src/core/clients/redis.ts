import IORedis from 'ioredis'
import { REDIS_HOST, REDIS_PORT } from '../../config'

const redisClient = new IORedis({
  host: REDIS_HOST,
  port: Number(REDIS_PORT),
  maxRetriesPerRequest: null,
})

export default redisClient
