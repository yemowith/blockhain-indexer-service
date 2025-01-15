import { S3Client } from '@aws-sdk/client-s3'
import { bootstrap } from './core/bootstrap'
import S3Uploader from './core/libs/S3Uploader'
import dbPrismaProvider from './core/providers/dbPrismaProvider'
import s3Provider from './core/providers/s3Provider'
import BatchRunner from './libs/operation/batchRunner'
import { Readable } from 'stream'
import { s3Client } from './core/clients/aws'

bootstrap()
;(async () => {
  // Usage example
})()
