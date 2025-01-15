// src/config/cacheGroups.ts
interface CacheGroup {
  name: string
  prefix: string
  ttl?: number
  validation?: (data: any) => boolean
}

function createCacheGroups<T extends Record<string, CacheGroup>>(groups: T): T {
  return groups
}

export const CACHE_GROUPS = createCacheGroups({
  // Base groups

  TOKEN: {
    name: 'token',
    prefix: 'token:',
    ttl: 86400,
  },

  OPERATIONS: {
    name: 'operation',
    prefix: 'ops:',
    ttl: 86400,
  },

  // Archive operation groups
  ARCHIVE_OPERATION: {
    name: 'archive',
    prefix: 'ops:archive:',
    ttl: 86400,
  },

  ARCHIVE_OPERATION_BATCH: {
    name: 'operation-batch',
    prefix: 'ops:archive:batchs:',
    ttl: 86400,
  },

  ARCHIVE_OPERATION_BATCH_BLOCKS: {
    name: 'operation-batch-blocks',
    prefix: 'ops:blocks:',
    ttl: 86400,
  },
})

export type CacheGroupKey = keyof typeof CACHE_GROUPS
