import redisClient from '@/core/clients/redis'
import dbPrismaProvider from '@/core/providers/dbPrismaProvider'
import path from 'path'
import fs from 'fs'
import s3Provider from '@/core/providers/s3Provider'

const cleanData = async () => {
  await dbPrismaProvider.operation.deleteAll()

  const keys = await redisClient.keys('ops*')
  // Then delete them if they exist
  if (keys.length > 0) {
    await redisClient.del(keys)
  }

  const filePath = path.join(config.BASE_STORAGE_PATH as string)
  if (fs.existsSync(filePath)) {
    fs.rmSync(filePath, { recursive: true, force: true })
  }

  try {
    const str =
      config.BASE_STORAGE_PATH + '/' + 'chain-' + config.CHAIN_ID + '/'
    await s3Provider.deleteFolder(config.BASE_STORAGE_PATH as string)
  } catch (error) {
    console.log(error)
  }
}

export default cleanData
