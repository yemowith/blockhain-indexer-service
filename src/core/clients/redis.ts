import IORedis from 'ioredis'
import { config } from '@/config'

const redisClient = new IORedis({
  host: config.REDIS.HOST,
  port: Number(config.REDIS.PORT),
  maxRetriesPerRequest: null,
})

export default redisClient
