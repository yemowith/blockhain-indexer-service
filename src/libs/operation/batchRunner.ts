import dbPrismaProvider from '@/core/providers/dbPrismaProvider'
import ScanBlock from '../scan/scanBlock'
import { Batch } from '@prisma/client'
import Logger from '@/core/helpers/logger'

import {
  BatchStatus,
  BlockScanStatus,
  TransactionInfo,
  TransferDB,
} from '@/types/types'
import path from 'path'
import fs from 'fs'
import { s3Client } from '@/core/clients/aws'
import S3Uploader from '@/core/libs/S3Uploader'
import FileWriter from './fileWriters/FileWriter'
import cacheProvider, { CACHE_GROUPS } from '@/core/providers/cacheProvider'

class BatchRunner {
  batch: Batch

  logger: Logger = new Logger('BatchRunner')
  fileWriter: FileWriter | null = null
  public writer: 'cvs' | 'parquet' = 'parquet'

  private basePathTransfers: string = 'storage'

  private filePath: string = ''
  forceScan: boolean

  constructor(batch: Batch, forceScan: boolean = false) {
    this.batch = batch
    this.forceScan = forceScan
  }

  private async getPath(): Promise<string> {
    const extension = this.writer === 'cvs' ? 'csv' : 'parquet'
    const fileName = `transfers-${this.batch.startBlock}-${this.batch.endBlock}.${extension}`
    const s3KeyFolderName = `chain-${config.CHAIN_ID}`
    const file = path.join(
      this.basePathTransfers,
      s3KeyFolderName,
      'transfers',
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
    this.logger.info(`Removing file ${this.filePath}`)
    if (fs.existsSync(this.filePath)) {
      fs.unlinkSync(this.filePath)
    }
  }

  private async uploadFile() {
    try {
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

  public async init() {
    this.filePath = await this.getPath()

    this.fileWriter = new FileWriter(this.filePath, this.writer)
    try {
      await this.fileWriter.init()
    } catch (error) {
      this.logger.error(`Error initializing file writer: ${error}`)
      throw error
    }
  }

  async updateBatchStatus(status: BatchStatus) {
    await dbPrismaProvider.batch.updateStatus(this.batch.id, status)
  }

  async updateOperationLastProcessedBlock(blockNumber: number) {
    await dbPrismaProvider.operation.updateLastProcessedBlock(
      this.batch.operationId,
      blockNumber,
    )
  }

  async getOperation() {
    const operation = await dbPrismaProvider.operation.get(
      this.batch.operationId,
    )
    if (!operation) {
      throw new Error('Operation not found')
    }
    return operation
  }

  private exportTransfers(transections: TransactionInfo[]): TransferDB[] {
    const transactionTransfers: TransferDB[] = []
    for (const transaction of transections) {
      const transfers = transaction.result?.transfers
      if (transfers?.length == 0 || !transfers) continue

      transactionTransfers.push(
        ...transfers.map((transfer) => ({
          txHash: transaction.hash,
          tType: transfer.type,
          tFrom: transfer.from,
          tTo: transfer.to,
          tValue: transfer.value,
          tTokenAdrs: transfer.tokenAddress,
          blckNum: transfer.blockNumber,
        })),
      )
    }

    return transactionTransfers
  }

  async saveTransfers(transactionTransfers: TransferDB[]) {
    if (transactionTransfers.length == 0) {
      this.logger.info('No transfers to save')
      return
    }

    await this.fileWriter?.writeRecords(transactionTransfers)

    this.logger.info(
      `Transfers saved to ${this.filePath} with ${transactionTransfers.length}`,
    )
  }

  async scanBlock(blockNumber: number) {
    this.logger.info(`Scanning block ${blockNumber}`)
    try {
      const scanBlock = new ScanBlock(blockNumber, {
        forceScan: this.forceScan,
        batchSize: 100,
        batchId: this.batch.id,
        operationId: this.batch.operationId,
      })

      const { status, transections } = await scanBlock.scan()

      if (status === BlockScanStatus.FAILED) {
        throw new Error('Failed to scan block')
      }

      const transfers = this.exportTransfers(transections)

      if (transfers.length > 0) {
        await this.saveTransfers(transfers)
      }
      return {
        status,
        transfers: transfers.length,
      }
    } catch (error) {
      this.logger.error(`Error scanning block ${blockNumber}: ${error}`)
      throw error
    }
  }

  async beforeRun() {
    if (!this.batch) {
      throw new Error('Batch not found')
    }

    this.logger.info(`Running batch ${this.batch.id}`)

    if (this.batch.status === 'completed' && !this.forceScan) {
      this.logger.info('Batch already completed')
      return
    }

    if (this.batch.status === 'failed' && !this.forceScan) {
      this.logger.info('Batch already failed')
      return
    }

    await this.init()

    await this.updateBatchStatus('running')
  }

  async afterRun() {
    if (!this.fileWriter) {
      this.logger.error(' Writer not initialized')
      return
    }

    await this.fileWriter?.close()

    await this.uploadFile()

    await new Promise((resolve) => setTimeout(resolve, 1000))

    await this.removeFile()

    await this.updateBatchStatus('completed')
  }

  async updateBatchProgress(result: any) {
    await cacheProvider.set(
      CACHE_GROUPS.ARCHIVE_OPERATION_BATCH,
      this.batch.id,
      result,
    )
  }

  async run() {
    await this.beforeRun()

    const countBlocks = this.batch.endBlock - this.batch.startBlock + 1

    const result = {
      blocksDone: 0,
      blocksFailed: 0,
      blocksToScan: countBlocks,
      countBlocks: countBlocks,
      progressPercentage: 0,
      transfers: 0,
    }

    try {
      for (let i = this.batch.startBlock; i <= this.batch.endBlock; i++) {
        try {
          const { status, transfers } = await this.scanBlock(i)
          result.blocksDone++
          result.transfers += transfers
        } catch (error) {
          this.logger.error(`Error scanning block ${i}: ${error}`)
          result.blocksFailed++
        }

        result.blocksToScan = countBlocks - result.blocksDone
        result.progressPercentage = parseFloat(
          ((result.blocksDone / countBlocks) * 100).toFixed(2),
        )

        await this.updateBatchProgress(result)

        this.logger.info(`Batch result: ${JSON.stringify(result)}`)
      }

      await this.afterRun()
    } catch (error) {
      this.logger.error(`Error running batch ${this.batch.id}: ${error}`)
      await this.updateBatchStatus('failed')
      throw error
    }

    return result
  }
}

export default BatchRunner
