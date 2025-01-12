const config = {
  CONTAINER_DB_PREFIX: 'c_',
  QUEUE_PREFIX: 'wallet-process-',
  CONTAINER_REDIS_PREFIX: 'container:',
}

export const setContainerQueueName = (containerId: string) => {
  return `${config.QUEUE_PREFIX}${containerId}`
}

export const setContainerDbName = (slug: string) => {
  return `${config.CONTAINER_DB_PREFIX}${slug}`
}

export const setContainerRedisKey = (containerId: string) => {
  return `${config.CONTAINER_REDIS_PREFIX}${containerId}`
}

const enums = {
  config,
  setContainerQueueName,
  setContainerDbName,
  setContainerRedisKey,
}

export default enums
