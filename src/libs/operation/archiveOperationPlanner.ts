import { ArchiveOperation, ArchiveOperationInfo, Batch } from '@/types/types'

import rpcProvider from '@/core/providers/rpcProvider'
import { createBatches } from '@/core/helpers/batcher'
import dbPrismaProvider from '@/core/providers/dbPrismaProvider'
import { Operation } from '@prisma/client'

class ArchiveOperationPlanner {
  // set start block
  private startBlock: number = 0

  // set batch size for per operation
  private batchSize: number = 10000

  // set last block for the operation
  private lastBlock: number = 0

  // set batch range for the operation
  private batchRange: number = 0

  private disableSaveOperation: boolean = false

  constructor(options?: {
    startBlock: number
    batchSize: number
    disableSaveOperation?: boolean
  }) {
    this.startBlock = options?.startBlock || 0
    this.batchSize = options?.batchSize || 1000000
    this.disableSaveOperation = options?.disableSaveOperation || false
  }

  private _getTotalBlocks() {
    return this.lastBlock - this.startBlock + 1
  }

  async getLastBlock() {
    const lastBlock = await rpcProvider.getLatestBlock()
    if (!lastBlock) {
      throw new Error('Failed to get last block')
    }
    this.lastBlock = lastBlock.number
    logger.info(`Last block: ${this.lastBlock}`)
    return lastBlock
  }

  private async createOperation(
    operationData: ArchiveOperation,
  ): Promise<Operation> {
    try {
      return await dbPrismaProvider.operation.create(operationData)
    } catch (error) {
      logger.error(`Error creating operation: ${error}`)
      throw error
    }
  }

  prepareBatches(totalBlocks: number, operationId: string) {
    const batchRanges = createBatches<Batch>(
      totalBlocks,
      this.batchSize,
      this.startBlock,
      {},
      (startBlock, endBlock, count, data) => ({
        status: 'pending',
        startBlock,
        endBlock,
        count,
        operationId: operationId,
        ...data,
      }),
    )
    this.batchRange = batchRanges.length
    return batchRanges
  }

  private async prepareOperation() {
    await this.getLastBlock()

    const operationInfo: ArchiveOperationInfo = {
      info: {
        totalBatches: this.batchRange,
        totalBatchesCompleted: 0,
        totalBatchesFailed: 0,
        totalBatchesPending: this.batchRange,
        startBlock: this.startBlock,
        endBlock: this.lastBlock,
        lastBlock: this.lastBlock,
        batchSize: this.batchSize,
        lastProcessedBlock: 0,
        totalBlocks: this._getTotalBlocks(),
        status: 'pending',
      },
      batches: [],
    }
    logger.info(`Batch range: ${this.batchRange}`)
    logger.info('Operation planned with info: ', operationInfo.info)

    return operationInfo
  }

  private async saveBatches(batches: Batch[]) {
    if (!batches || batches.length === 0) {
      logger.info('No batches to save')
      return
    }

    logger.info(`Batches to save: ${batches.length}`)

    let savedBatches: Batch[] = []
    if (batches.length <= 100) {
      let savedBatches = await dbPrismaProvider.batch.createMany(batches)
      if (savedBatches) {
        savedBatches.push(...savedBatches)
      }
    } else {
      for (let i = 0; i < batches.length; i += 100) {
        const batchChunk = batches.slice(i, i + 100)
        const savedChunk = await dbPrismaProvider.batch.createMany(batchChunk)
        if (savedChunk) {
          savedBatches.push(...batchChunk)
        }
      }
    }

    return savedBatches
  }

  async saveOperation(
    operationInfo: ArchiveOperationInfo,
    force: boolean = false,
  ) {
    const operation = await this.createOperation(operationInfo.info)

    if (!operation) {
      throw new Error('Failed to create operation')
    }

    logger.info(`Operation created: ${operation.id}`)

    logger.info(`Total blocks: ${this._getTotalBlocks()}`)

    const batches = this.prepareBatches(this._getTotalBlocks(), operation.id)

    await dbPrismaProvider.operation.update(operation.id, {
      totalBatches: batches.length,
      totalBatchesPending: batches.length,
    })

    logger.info(`Batches prepared: ${batches.length}`)

    const savedBatches = await this.saveBatches(batches)

    logger.info(`Saved batches: ${savedBatches?.length}`)

    if (!savedBatches) {
      throw new Error('Failed to save batches')
    }

    operationInfo.batches = batches
  }

  async run(): Promise<ArchiveOperationInfo> {
    const operation = await this.prepareOperation()

    if (!this.disableSaveOperation) {
      await this.saveOperation(operation)
    } else {
      logger.info('Operation not saved')
    }

    return operation
  }
}

export default ArchiveOperationPlanner
