import Redis from 'ioredis'
import redisClient from '@/core/clients/redis'
import { CACHE_GROUPS } from '@/config/cacheGroups';

// Define group types
type CacheGroup = {
  name: string;
  prefix: string;
  ttl?: number;
}


type CacheGroupKey = keyof typeof CACHE_GROUPS;

export type CacheValue<T = any> = {
  value: T;
  ttl?: number;
}

class CacheProvider {
  private redis: Redis;
  private enabledLogging: boolean = false;

  constructor(redisClient: Redis) {
    this.redis = redisClient;

  }

  private getFullKey(group: CacheGroup, key: string): string {
    return `${group.prefix}${key}`;
  }

  async set(group: CacheGroup, key: string, value: any, customTtl?: number) {
    const fullKey = this.getFullKey(group, key);
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    const ttl = customTtl || group.ttl;

    if (ttl) {
      await this.redis.set(fullKey, stringValue, 'EX', ttl);
    } else {
      await this.redis.set(fullKey, stringValue);
    }

    if (this.enabledLogging) {
      logger.info(`Cache set for ${group.name} key: ${key}`);
    }
  }

  async get<T>(group: CacheGroup, key: string): Promise<T | null> {
    const fullKey = this.getFullKey(group, key);
    const cachedValue = await this.redis.get(fullKey);

    if (!cachedValue) {
      if (this.enabledLogging) {
        logger.info(`Cache miss for ${group.name} key: ${key}`);
      }
      return null;
    }

    try {
      return JSON.parse(cachedValue) as T;
    } catch {
      return cachedValue as T;
    }
  }

  async delete(group: CacheGroup, key: string) {
    const fullKey = this.getFullKey(group, key);
    await this.redis.del(fullKey);
    if (this.enabledLogging) {
      logger.info(`Cache deleted for ${group.name} key: ${key}`);
    }
  }

  async deleteByGroup(group: CacheGroup) {
    const pattern = `${group.prefix}*`;
    const keys = await this.redis.keys(pattern);
    
    if (keys.length > 0) {
      await this.redis.del(...keys);
      if (this.enabledLogging) {
        logger.info(`Deleted ${keys.length} keys from group ${group.name}`);
      }
    }
  }

  async keys(group: CacheGroup) {
    const pattern = `${group.prefix}*`;
    const allKeys = await this.redis.keys(pattern);
    return allKeys.map((fullkey) => {
      return {
        fullkey,
        key: fullkey.replace(group.prefix, ''),
      };
    });
  }

  

  async exists(group: CacheGroup, key: string) {
    const fullKey = this.getFullKey(group, key);
    const exists = await this.redis.exists(fullKey);
    return exists > 0;
  }
 
  async flushAll() {
    await this.redis.flushall();
    if (this.enabledLogging) {
      logger.info('All cache entries cleared.');
    }
  }

  // Group specific methods
  async getGroupMembers(group: CacheGroup): Promise<string[]> {
    const keys = await this.keys(group);
    return keys.map(key => key.key);
  }

  async getGroupSize(group: CacheGroup): Promise<number> {
    const keys = await this.keys(group);
    return keys.length;
  }

  

  async mset<T>(group: CacheGroup, items: Record<string, CacheValue<T>>) {
    const pipeline = this.redis.pipeline();
    
    Object.entries(items).forEach(([key, item]) => {
      const fullKey = this.getFullKey(group, key);
      const stringValue = typeof item.value === 'string' 
        ? item.value 
        : JSON.stringify(item.value);
      
      const ttl = item.ttl || group.ttl;
      if (ttl) {
        pipeline.setex(fullKey, ttl, stringValue);
      } else {
        pipeline.set(fullKey, stringValue);
      }
    });

    await pipeline.exec();
    if (this.enabledLogging) {
      logger.info(`Batch set ${Object.keys(items).length} items in group ${group.name}`);
    }
}

  async mget<T>(group: CacheGroup, keys: string[]): Promise<(T | null)[]> {
    const fullKeys = keys.map(key => this.getFullKey(group, key));
    const values = await this.redis.mget(fullKeys);
    
    return values.map(value => {
      if (!value) return null;
      try {
        return JSON.parse(value) as T;
      } catch {
        return value as T;
      }
    });
  }
}

// Create instance
const cacheProvider = new CacheProvider(redisClient);

// Export both the instance and types
export { cacheProvider as default, CACHE_GROUPS, type CacheGroup, type CacheGroupKey };
