import { TransactionResponse } from 'ethers'
import { BlockStatus } from '@prisma/client'
import analyzeTransection from './analyzeTransection'
import TaskQueue from '../../../core/libs/TaskQueue'
import task from '../../../core/tasks/task'
import rpcProvider from '../../../providers/rpcProvider'
import dbPrismaProvider from '../../../providers/dbPrismaProvider'
import Logger from '../../../core/helpers/logger'
import processAnalyzeResults from './processAnalyzeResults'

interface ScanBlockArgs {
  blockNumber: number
}

interface ScanBlockResult {
  success: boolean
  message?: string
  errors?: Array<{
    transactionHash: string
    error: Error
  }>
}

interface ProcessingReport {
  blockNumber: number
  rapor: any // Replace 'any' with proper type
}

class BlockScanner {
  private readonly logger: Logger
  private readonly queue: TaskQueue

  constructor() {
    this.logger = new Logger('BlockScanner')
    this.queue = new TaskQueue(5, 200) // Max 5 workers, 200ms delay
  }

  public async scanBlock(args: ScanBlockArgs): Promise<ScanBlockResult> {
    return await task(
      'scan-block',
      args,
      async ({ blockNumber }: ScanBlockArgs) => {
        try {
          await this.validateBlockNumber(blockNumber)
          await this.checkBlockStatus(blockNumber)

          const transactions = await this.getBlockTransactions(blockNumber)
          if (!transactions.length) {
            await this.updateBlockStatus(blockNumber, BlockStatus.PROCESSED)
            return this.createResult(false, 'No transactions found')
          }

          this.logger.info(
            `Scanning block ${blockNumber} with ${transactions.length} transactions`,
          )

          const { reports, errors } = await this.processTransactions(
            blockNumber,
            transactions,
          )

          await this.updateBlockStatus(blockNumber, BlockStatus.PROCESSED)

          return this.createResult(errors.length === 0, undefined, errors)
        } catch (error) {
          await this.handleError(blockNumber, error)
          return this.createResult(false, 'Block scanning failed')
        }
      },
    )
  }

  private async validateBlockNumber(blockNumber: number): Promise<void> {
    if (!blockNumber || isNaN(blockNumber)) {
      throw new Error('Invalid block number provided')
    }
  }

  private async checkBlockStatus(blockNumber: number): Promise<void> {
    const blockStatus = await dbPrismaProvider.blocks.getBlockStatus(
      blockNumber,
    )
    if (blockStatus) {
      throw new Error('Block already processed')
    }
    await this.updateBlockStatus(blockNumber, BlockStatus.SCANNING)
  }

  private async getBlockTransactions(
    blockNumber: number,
  ): Promise<TransactionResponse[]> {
    const transactions = await rpcProvider.getBlockTransactions(blockNumber)
    return transactions || []
  }

  private async processTransactions(
    blockNumber: number,
    transactions: TransactionResponse[],
  ): Promise<{ reports: ProcessingReport[]; errors: any[] }> {
    const reports: ProcessingReport[] = []
    const errors: any[] = []

    const processTransaction = async (transaction: TransactionResponse) => {
      try {
        this.logger.debug(`Processing transaction ${transaction.hash}`)
        const result = await analyzeTransection(transaction)

        if (result.tokenTransfers.length > 0) {
          const report = await this.createTransactionReport(
            blockNumber,
            transaction,
            result,
          )
          reports.push(report)
          this.logger.info(
            `Report created for transaction ${transaction.hash} with ${result.tokenTransfers.length} token transfers`,
          )
        }
      } catch (error) {
        this.logger.error(
          `Error processing transaction ${transaction.hash}:`,
          error,
        )
        errors.push({
          transactionHash: transaction.hash,
          error: error instanceof Error ? error : new Error(String(error)),
        })
      }
    }

    await Promise.all(
      transactions.map((transaction) =>
        this.queue.add(processTransaction, transaction),
      ),
    )

    return { reports, errors }
  }

  private async createTransactionReport(
    blockNumber: number,
    transaction: TransactionResponse,
    result: any, // Replace 'any' with proper type
  ): Promise<ProcessingReport> {
    const rapor = await processAnalyzeResults(result)
    return {
      blockNumber,
      rapor,
    }
  }

  private async updateBlockStatus(
    blockNumber: number,
    status: BlockStatus,
  ): Promise<void> {
    try {
      await dbPrismaProvider.blocks.updateBlockStatus(blockNumber, status)
    } catch (error) {
      this.logger.error(
        `Failed to update block ${blockNumber} status to ${status}:`,
        error,
      )
      throw error
    }
  }

  private async handleError(
    blockNumber: number,
    error: unknown,
  ): Promise<void> {
    this.logger.error(`Error processing block ${blockNumber}:`, error)
    await this.updateBlockStatus(blockNumber, BlockStatus.FAILED)
  }

  private createResult(
    success: boolean,
    message?: string,
    errors?: any[],
  ): ScanBlockResult {
    return {
      success,
      ...(message && { message }),
      ...(errors?.length && { errors }),
    }
  }
}

// Export singleton instance
export const blockScanner = new BlockScanner()
