import dbPrismaProvider from '@/core/providers/dbPrismaProvider'
import ScanBlock from '../scan/scanBlock'
import { Batch } from '@prisma/client'
import Logger from '@/core/helpers/logger'
import {
  BatchResult,
  BatchStatus,
  BlockScanStatus,
  IExporter,
} from '@/types/types'
import cacheProvider, { CACHE_GROUPS } from '@/core/providers/cacheProvider'
import { TransfersExporter } from './exporters/transfersExporter'

class BatchRunner {
  private batch: Batch
  private logger: Logger = new Logger('BatchRunner')
  private forceScan: boolean
  private inited: boolean = false
  private exporters: IExporter[] = []

  constructor(batch: Batch, forceScan: boolean = false) {
    this.batch = batch
    this.forceScan = forceScan
    this.exporters.push(new TransfersExporter(this.batch))
  }

  private async init(): Promise<void> {
    if (this.inited) return

    await Promise.all(this.exporters.map((exporter) => exporter.init()))
    this.inited = true
  }

  private async updateBatchStatus(status: BatchStatus): Promise<void> {
    await dbPrismaProvider.batch.updateStatus(this.batch.id, status)
  }

  private async updateOperationLastProcessedBlock(
    blockNumber: number,
  ): Promise<void> {
    await dbPrismaProvider.operation.updateLastProcessedBlock(
      this.batch.operationId,
      blockNumber,
    )
  }

  private checkStatusBeforeRun(): boolean {
    if (!this.batch) throw new Error('Batch not found')

    this.logger.info(`Running batch ${this.batch.id}`)

    if (
      ['completed', 'failed'].includes(this.batch.status) &&
      !this.forceScan
    ) {
      this.logger.info(`Batch already ${this.batch.status}`)
      return false
    }

    return true
  }

  private async beforeRun(): Promise<boolean> {
    if (!this.checkStatusBeforeRun()) return false

    await this.init()
    await Promise.all(
      this.exporters.map((exporter) => exporter.beforeBatchRun()),
    )
    await this.updateBatchStatus('running')

    return true
  }

  private async afterRun(result: BatchResult): Promise<Record<string, any>> {
    const results = await Promise.all(
      this.exporters.map((exporter) => exporter.afterBatchRun(result)),
    )

    await this.updateBatchStatus('completed')
    return Object.assign({}, ...results)
  }

  private async updateBatchProgress(result: any): Promise<void> {
    await cacheProvider.set(
      CACHE_GROUPS.ARCHIVE_OPERATION_BATCH,
      this.batch.id,
      result,
    )
  }

  public async run(): Promise<BatchResult> {
    if (!(await this.beforeRun())) return {} as BatchResult

    this.logger.info(`Running batch ${this.batch.id}`)

    const countBlocks = this.batch.endBlock - this.batch.startBlock + 1
    let runResult: BatchResult & {
      transfersCount: number
      walletsCount: number
    } = {
      blocksDone: 0,
      blocksFailed: 0,
      blocksToScan: countBlocks,
      countBlocks,
      progressPercentage: 0,
      transfersCount: 0,
      walletsCount: 0,
    }

    try {
      for (let i = this.batch.startBlock; i <= this.batch.endBlock; i++) {
        try {
          const scanBlock = new ScanBlock(i, {
            forceScan: this.forceScan,
            batchSize: 100,
            batchId: this.batch.id,
            operationId: this.batch.operationId,
          })

          const { status, transections } = await scanBlock.scan()

          if (status === BlockScanStatus.FAILED) {
            throw new Error('Failed to scan block')
          }

          runResult.blocksDone++

          for (const exporter of this.exporters) {
            const result = await exporter.afterBlockScan({
              blockNumber: i,
              status,
              transections,
            })
            runResult.transfersCount += result.transfersCount
            runResult.walletsCount += result.walletsCount
          }
        } catch (error) {
          // @ts-ignore
          this.logger.error(`Error scanning block ${i}: ${error.message}`)
          runResult.blocksFailed++
        }

        runResult.blocksToScan = countBlocks - runResult.blocksDone
        runResult.progressPercentage = parseFloat(
          ((runResult.blocksDone / countBlocks) * 100).toFixed(2),
        )

        await this.updateBatchProgress(runResult)

        this.logger.info(
          `Batch ${this.batch.id} progress: ${runResult.progressPercentage}%`,
        )
      }

      this.logger.info(`Batch ${this.batch.id} completed`)
      this.logger.info(`Batch ${this.batch.id} result: ${runResult}`)

      const finalResult = await this.afterRun(runResult)
      Object.assign(runResult, finalResult)
    } catch (error) {
      // @ts-ignore
      this.logger.error(
        // @ts-ignore
        `Error running batch ${this.batch.id}: ${error.message}`,
      )
      await this.updateBatchStatus('failed')
      throw error
    }

    return runResult
  }
}

export default BatchRunner
