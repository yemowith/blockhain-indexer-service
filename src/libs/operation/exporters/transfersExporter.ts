// transfersExporter.ts
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
import fs from 'fs/promises'
import ParquetHealthChecker from '@/core/libs/ParquetHealthChecker'
import S3Uploader from '@/core/libs/S3Uploader'
import { s3Client } from '@/core/clients/aws'
import FileWriter from '../fileWriters/FileWriter'

export class TransfersExporter implements IExporter {
  private fileWriter: FileWriter | null = null
  private writer: 'cvs' | 'parquet' = 'parquet'
  private basePath = 'transfers'
  private filePath = ''
  private removeFileAfterUpload = true
  private batch: Batch
  private totalTransfersCount = 0
  private logger = new Logger('TransfersExporter')

  private parquetSchema = {
    tType: { type: 'UTF8' },
    tFrom: { type: 'UTF8' },
    tTo: { type: 'UTF8' },
    tValue: { type: 'UTF8' },
    tTokenAdrs: { type: 'UTF8' },
    blckNum: { type: 'INT32' },
    txHash: { type: 'UTF8' },
  }

  constructor(batch: Batch) {
    this.batch = batch
  }

  async init(): Promise<void> {
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

    await fs.mkdir(path.dirname(file), { recursive: true })
    return file
  }

  private async removeFile(): Promise<void> {
    if (!this.removeFileAfterUpload) return
    if (await fs.stat(this.filePath).catch(() => false)) {
      this.logger.info(`Removing file ${this.filePath}`)
      await fs.unlink(this.filePath)
    }
  }

  private async uploadFile(): Promise<void> {
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
      await uploader.uploadFile(this.filePath, this.filePath, {
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
    } catch (error) {
      // @ts-ignore
      this.logger.error(`Error uploading file to S3: ${error.message}`)
      throw error
    }
  }

  private exportTransfers(transections: TransactionInfo[]): TransferDB[] {
    return transections.flatMap((transaction) => {
      const transfers = transaction.result?.transfers || []
      return transfers.map((transfer) => ({
        txHash: transaction.hash,
        tType: transfer.type,
        tFrom: transfer.from,
        tTo: transfer.to,
        tValue: transfer.value,
        tTokenAdrs: transfer.tokenAddress,
        blckNum: transfer.blockNumber,
      }))
    })
  }

  async saveTransfers(transactionTransfers: TransferDB[]): Promise<void> {
    if (transactionTransfers.length === 0) {
      this.logger.info('No transfers to save')
      return
    }

    this.totalTransfersCount += transactionTransfers.length
    await this.fileWriter?.writeRecords(transactionTransfers)

    this.logger.info(
      `Transfers saved to ${this.filePath} with ${transactionTransfers.length}`,
    )
  }

  async beforeBatchRun(): Promise<void> {
    await this.init()
  }

  async afterBatchRun(
    result: BatchResult,
  ): Promise<{ transfersCount: number }> {
    await this.fileWriter?.close()

    if (this.totalTransfersCount > 0) {
      this.logger.info(
        `Uploading file ${this.filePath} with ${this.totalTransfersCount} transfers`,
      )
      await this.uploadFile()
    } else {
      this.logger.info('No transfers to upload')
    }

    await this.removeFile()

    return { transfersCount: this.totalTransfersCount }
  }

  async afterBlockScan(result: {
    blockNumber: number
    status: BlockScanStatus
    transections: TransactionInfo[]
  }): Promise<{ transfers: TransferDB[]; transfersCount: number }> {
    const transactionTransfers = this.exportTransfers(result.transections)
    await this.saveTransfers(transactionTransfers)

    return {
      transfers: transactionTransfers,
      transfersCount: transactionTransfers.length,
    }
  }
}
