import { S3Client } from '@aws-sdk/client-s3'
import { bootstrap } from './core/bootstrap'
import S3Uploader from './core/libs/S3Uploader'
import dbPrismaProvider from './core/providers/dbPrismaProvider'
import s3Provider from './core/providers/s3Provider'
import BatchRunner from './libs/operation/batchRunner'
import { Readable } from 'stream'
import { s3Client } from './core/clients/aws'
import ScanBlock from './libs/scan/scanBlock'
import ParquetFileWriter from './libs/operation/fileWriters/ParquetFileWriter'
import { statSync } from 'fs'
import fs from 'fs'
import batchRunTask from './tasks/batchRun'
import parquetjs from '@dsnp/parquetjs'
import ParquetHealthChecker from './core/libs/ParquetHealthChecker'
import path from 'path'
import { WalletClassify } from './core/libs/WalletClassify'

bootstrap()
;(async () => {
  // Usage example
  // await batchRunTask({})

  const batch = await dbPrismaProvider.batch.get(
    '005c568d-4eeb-4c9c-bf00-24eeab5fe559',
  )
  if (!batch) {
    console.log('No batch found')
    return
  }
  const batchRunner = new BatchRunner(batch, true)

  await batchRunner.run()
})()
