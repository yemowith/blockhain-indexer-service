import cacheProvider, { CACHE_GROUPS } from '@/core/providers/cacheProvider'
import rpcProvider from '@/core/providers/rpcProvider'
import { BlockScanStatus } from '@/types/types'
import { BlockScanInfo, TransactionInfo } from '@/types/types'

import { Block, TransactionResponse } from 'ethers'
import { ScanTransaction } from './scanTransection'
import Logger from '@/core/helpers/logger'
import pLimit from 'p-limit'
import processWithConcurrency from '@/core/helpers/promisePool'

class ScanBlock {
  private static readonly BLOCK_SCAN_PREFIX = 'scan:'
  private static readonly BLOCK_TXS_PREFIX = 'block_txs:'
  public batchId: string = ''
  public operationId: string = ''
  private logger: Logger = new Logger('scanBlock')
  constructor(
    private readonly blockNumber: number,
    private readonly options: {
      forceScan?: boolean
      batchSize?: number
      batchId?: string
      operationId?: string
    } = {},
  ) {
    this.batchId = options.batchId || ''
    this.operationId = options.operationId || ''
  }

  private getCacheKey(): string {
    if (!this.batchId || !this.operationId) {
      return `${ScanBlock.BLOCK_SCAN_PREFIX}:${this.blockNumber}`
    } else if (this.batchId && this.operationId) {
      return `${ScanBlock.BLOCK_SCAN_PREFIX}:${this.batchId}:${this.operationId}:${this.blockNumber}`
    } else if (this.batchId) {
      return `${ScanBlock.BLOCK_SCAN_PREFIX}:${this.batchId}:${this.blockNumber}`
    } else {
      return `${ScanBlock.BLOCK_SCAN_PREFIX}:${this.blockNumber}`
    }
  }

  // Get block scan status
  private async getBlockScanStatus(): Promise<BlockScanInfo | null> {
    const cacheKey = this.getCacheKey()
    return await cacheProvider.get<BlockScanInfo>(
      CACHE_GROUPS.ARCHIVE_OPERATION_BATCH_BLOCKS,
      cacheKey,
    )
  }

  // Set block scan status
  private async setBlockScanStatus(
    status: BlockScanStatus,
    data: Partial<BlockScanInfo> = {},
  ) {
    const cacheKey = this.getCacheKey()
    const scanInfo: BlockScanInfo = {
      blockNumber: this.blockNumber,
      status,
      timestamp: Date.now(),
      ...data,
    }
    await cacheProvider.set(
      CACHE_GROUPS.ARCHIVE_OPERATION_BATCH_BLOCKS,
      cacheKey,
      scanInfo,
    )
  }

  private async getBlockTransactions(): Promise<TransactionInfo[]> {
    try {
      const block = (await rpcProvider.getBlock(
        this.blockNumber,
        true,
      )) as Block
      if (!block) {
        throw new Error(`Block ${this.blockNumber} not found`)
      }

      // Ensure transactions exist and are of correct type
      if (!block.transactions || !Array.isArray(block.transactions)) {
        this.logger.warn(`No transactions found in block ${this.blockNumber}`)
        return []
      }
      const batchSize = 20 // Define the batch size
      const txs = []
      const concurrency = 20

      // Usage in your code:
      for (let i = 0; i < block.transactions.length; i += batchSize) {
        const batch = block.transactions.slice(i, i + batchSize)

        const batchTxs = await processWithConcurrency(
          batch,
          concurrency, // concurrency limit
          async (tx) => {
            if (typeof tx === 'string') {
              await new Promise((resolve) => setTimeout(resolve, 20))
              return await rpcProvider.getTransaction(tx)
            }
            return tx
          },
        )

        txs.push(...batchTxs)
      }

      const transactions = txs
        .map((tx: TransactionResponse) => {
          // Ensure all required fields exist and handle potential undefined values
          if (!tx.hash || !tx.from) {
            this.logger.warn(
              `Invalid transaction data in block ${this.blockNumber}:`,
              tx,
            )
            return null
          }

          return {
            hash: tx.hash,
            from: tx.from,
            to: tx.to || null, // Handle null address
            value: tx.value, // Handle undefined value
            blockNumber: this.blockNumber,
            data: tx.data,
          }
        })

        .filter((tx): tx is TransactionInfo => tx !== null) // Remove null entries

      return transactions
    } catch (error) {
      this.logger.error(
        `Failed to get transactions for block ${this.blockNumber}:`,
        error instanceof Error ? error.message : error,
      )
      throw error
    }
  }

  // Process single transaction
  private async processTransaction(
    tx: TransactionInfo,
  ): Promise<TransactionInfo> {
    try {
      const receipt = await rpcProvider.getTransactionReceipt(tx.hash)
      if (!receipt) {
        throw new Error(`No receipt found for transaction ${tx.hash}`)
      }

      const scanner = new ScanTransaction(tx)
      const result = await scanner.scan()

      this.logger.info(
        `Transaction processed: with ${result.transfers.length} transfers`,
      )

      return {
        ...tx,
        result,
      }
    } catch (error) {
      this.logger.error(
        `Failed to process transaction ${tx.hash}:`,
        error instanceof Error ? error.message : error,
      )

      throw error
    }
  }

  // Process transactions in batches
  private async processTransactionBatch(
    transactions: TransactionInfo[],
    batchSize: number,
  ): Promise<TransactionInfo[]> {
    const results: TransactionInfo[] = []

    for (let i = 0; i < transactions.length; i += batchSize) {
      const batch = transactions.slice(i, i + batchSize)
      const batchResults = await Promise.all(
        batch.map((tx) => this.processTransaction(tx)),
      )

      await this.setBlockScanStatus(BlockScanStatus.RUNNING, {
        transactionCount: results.length,
        lastProcessedTx: batch[batch.length - 1].hash,
      })
      results.push(...batchResults)
    }

    return results
  }

  // Main scan method
  async scan(): Promise<{
    status: BlockScanStatus
    transections: TransactionInfo[]
  }> {
    try {
      // Check existing scan status
      const existingStatus = await this.getBlockScanStatus()
      if (
        existingStatus?.status === BlockScanStatus.SCANNED &&
        !this.options.forceScan
      ) {
        this.logger.info(`Block ${this.blockNumber} already scanned`)
        return {
          status: existingStatus.status,
          transections: [],
        }
      }

      // Set initial status
      await this.setBlockScanStatus(BlockScanStatus.RUNNING)

      // Get all transactions
      const transactions = await this.getBlockTransactions()

      // Update status to running
      await this.setBlockScanStatus(BlockScanStatus.RUNNING, {
        transactionCount: transactions.length,
      })

      // Process transactions in batches
      const processedTransactions = await this.processTransactionBatch(
        transactions,
        this.options.batchSize || 10,
      )

      // Set final success status
      const finalStatus: BlockScanInfo = {
        blockNumber: this.blockNumber,
        status: BlockScanStatus.SCANNED,
        timestamp: Date.now(),
        transactionCount: processedTransactions.length,
      }
      await this.setBlockScanStatus(BlockScanStatus.SCANNED, finalStatus)

      return {
        status: finalStatus.status,
        transections: processedTransactions,
      }
    } catch (error) {
      // Set failed status
      const errorStatus: BlockScanInfo = {
        blockNumber: this.blockNumber,
        status: BlockScanStatus.FAILED,
        timestamp: Date.now(),
        error: error instanceof Error ? error.message : String(error),
      }
      await this.setBlockScanStatus(BlockScanStatus.FAILED, errorStatus)

      this.logger.error(`Failed to scan block ${this.blockNumber}:`, error)
      throw error
    }
  }
}

export default ScanBlock
