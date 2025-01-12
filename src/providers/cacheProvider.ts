import Redis from 'ioredis'
import redisClient from '../core/clients/redis'

const cacheProvider = {
  async set(key: string, value: any, ttlSeconds?: number) {
    const stringValue =
      typeof value === 'string' ? value : JSON.stringify(value)

    if (ttlSeconds) {
      await redisClient.set(key, stringValue, 'EX', ttlSeconds)
    } else {
      await redisClient.set(key, stringValue)
    }

    console.log(`Cache set for key: ${key}`)
  },

  async get<T>(key: string): Promise<T | null> {
    const cachedValue = await redisClient.get(key)
    if (!cachedValue) {
      console.log(`Cache miss for key: ${key}`)
      return null
    }

    try {
      return JSON.parse(cachedValue) as T
    } catch {
      return cachedValue as T
    }
  },

  async delete(key: string) {
    await redisClient.del(key)
    console.log(`Cache deleted for key: ${key}`)
  },

  async keys(pattern: string = '*') {
    const allKeys = await redisClient.keys(pattern)
    console.log(`Keys matching pattern "${pattern}":`, allKeys)
    return allKeys
  },

  async flushAll() {
    await redisClient.flushall()
    console.log('All cache entries cleared.')
  },

  async exists(key: string) {
    const exists = await redisClient.exists(key)
    console.log(`Key "${key}" exists: ${exists > 0}`)
    return exists > 0
  },
}

export default cacheProvider
