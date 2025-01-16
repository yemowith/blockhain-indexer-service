import Logger from '@/core/helpers/logger'
import {
  BatchResult,
  IExporter,
  TransactionInfo,
  TransferDB,
} from '@/types/types'
import { BlockScanStatus } from '@/types/types'
import { Batch } from '@prisma/client'

import path from 'path'
import fs from 'fs'
import ParquetHealthChecker from '@/core/libs/ParquetHealthChecker'
import S3Uploader from '@/core/libs/S3Uploader'
import { s3Client } from '@/core/clients/aws'
import FileWriter from '../fileWriters/FileWriter'

export class WalletsExporter implements IExporter {
  private fileWriter: FileWriter | null = null
  public writer: 'cvs' | 'parquet' = 'parquet'
  private basePath: string = 'wallets'
  private filePath: string = ''
  private removeFileAfterUpload: boolean = false
  private batch: Batch

  private parquetSchema: any = {
    tType: { type: 'UTF8' },
    tFrom: { type: 'UTF8' },
    tTo: { type: 'UTF8' },
    tValue: { type: 'UTF8' },
    tTokenAdrs: { type: 'UTF8' },
    blckNum: { type: 'INT32' },
    txHash: { type: 'UTF8' },
  }

  private logger: Logger = new Logger('WalletsExporter')

  constructor(batch: Batch) {
    this.batch = batch
  }

  async init() {
    this.logger.info('Initializing wallets exporter')
    this.filePath = await this.getPath()
    this.fileWriter = new FileWriter(
      this.filePath,
      this.writer,
      this.parquetSchema,
    )
    await this.fileWriter.init()
  }

  private async getPath(): Promise<string> {
    const extension = this.writer === 'cvs' ? 'csv' : 'parquet'
    const fileName = `transfers-${this.batch.startBlock}-${this.batch.endBlock}.${extension}`
    const s3KeyFolderName = `chain-${config.CHAIN_ID}`
    const file = path.join(
      config.BASE_STORAGE_PATH as string,
      s3KeyFolderName,
      this.basePath,
      fileName,
    )

    return new Promise((resolve, reject) => {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file)
      }
      fs.mkdirSync(path.dirname(file), { recursive: true })
      resolve(file)
    })
  }

  private async removeFile() {
    if (!this.removeFileAfterUpload) {
      return
    }
    this.logger.info(`Removing file ${this.filePath}`)
    if (fs.existsSync(this.filePath)) {
      fs.unlinkSync(this.filePath)
    }
  }

  private async uploadFile() {
    try {
      const health = await ParquetHealthChecker.checkHealth(this.filePath)
      if (!health.canBeUploaded) {
        this.logger.info('File is empty, not uploading', {
          filePath: this.filePath,
          health,
        })
        return
      }
      const uploader = new S3Uploader(s3Client, config.AWS.S3_BUCKET as string)
      const result = await uploader.uploadFile(this.filePath, this.filePath, {
        contentType: 'application/octet-stream',
        public: true,
        metadata: {
          chainId: config.CHAIN_ID as string,
          operationId: this.batch.operationId,
          batchId: this.batch.id,
          startBlock: this.batch.startBlock.toString(),
          endBlock: this.batch.endBlock.toString(),
        },
      })
      return result
    } catch (error) {
      this.logger.error(`Error uploading file to S3: ${error}`)
      throw error
    }
  }

  private exportWallets(transections: TransactionInfo[]): any[] {
    const wallets: any[] = []
    for (const transaction of transections) {
      const transfers = transaction.result?.transfers
      if (transfers?.length == 0 || !transfers) continue
      wallets.push(transaction.result?.to)
      wallets.push(transaction.result?.from)
    }

    return wallets
  }

  async saveWallets(transactionWallets: TransferDB[]) {
    if (transactionWallets.length == 0) {
      this.logger.info('No transfers to save')
      return
    }

    await this.fileWriter?.writeRecords(transactionWallets)

    this.logger.info(
      `Wallets saved to ${this.filePath} with ${transactionWallets.length}`,
    )
  }

  async beforeBatchRun() {
    await this.init()
  }

  async afterBatchRun(result: BatchResult) {
    await this.fileWriter?.close()

    await this.uploadFile()
    await this.removeFile()

    return {}
  }

  async afterBlockScan(result: {
    blockNumber: number
    status: BlockScanStatus
    transections: TransactionInfo[]
  }): Promise<{
    status: BlockScanStatus
    wallets: any
  }> {
    const transactionWallets = this.exportWallets(result.transections)
    await this.saveWallets(transactionWallets)

    return {
      status: result.status,
      wallets: transactionWallets,
    }
  }
}
