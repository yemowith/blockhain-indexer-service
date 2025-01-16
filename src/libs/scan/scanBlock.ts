import cacheProvider, { CACHE_GROUPS } from '@/core/providers/cacheProvider'
import rpcProvider from '@/core/providers/rpcProvider'
import { BlockScanStatus } from '@/types/types'
import { BlockScanInfo, TransactionInfo } from '@/types/types'
import { Block, TransactionResponse } from 'ethers'
import { ScanTransaction } from './scanTransection'
import Logger from '@/core/helpers/logger'
import processWithConcurrency from '@/core/helpers/promisePool'

class ScanBlock {
  private static readonly BLOCK_SCAN_PREFIX = 'scan:'
  private static readonly BLOCK_TXS_PREFIX = 'block_txs:'
  private logger: Logger = new Logger('ScanBlock')

  public batchId: string = ''
  public operationId: string = ''

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
    const parts = [
      ScanBlock.BLOCK_SCAN_PREFIX,
      this.batchId,
      this.operationId,
      this.blockNumber.toString(),
    ]
    return parts.filter(Boolean).join(':')
  }

  private async getBlockScanStatus(): Promise<BlockScanInfo | null> {
    return await cacheProvider.get<BlockScanInfo>(
      CACHE_GROUPS.ARCHIVE_OPERATION_BATCH_BLOCKS,
      this.getCacheKey(),
    )
  }

  private async setBlockScanStatus(
    status: BlockScanStatus,
    data: Partial<BlockScanInfo> = {},
  ): Promise<void> {
    const scanInfo: BlockScanInfo = {
      blockNumber: this.blockNumber,
      status,
      timestamp: Date.now(),
      ...data,
    }
    await cacheProvider.set(
      CACHE_GROUPS.ARCHIVE_OPERATION_BATCH_BLOCKS,
      this.getCacheKey(),
      scanInfo,
    )

    this.logger.info(`${this.blockNumber} Block scan status set: ${status}`)
  }

  private async getBlockTransactions(): Promise<TransactionInfo[]> {
    try {
      const block = (await rpcProvider.getBlock(
        this.blockNumber,
        true,
      )) as Block
      if (!block) throw new Error(`Block ${this.blockNumber} not found`)

      if (!block.transactions || !Array.isArray(block.transactions)) {
        this.logger.warn(`No transactions found in block ${this.blockNumber}`)
        return []
      }

      const concurrency = 20
      const transactions = await processWithConcurrency(
        block.transactions,
        concurrency,
        async (txHash) => {
          if (typeof txHash === 'string') {
            return await rpcProvider.getTransaction(txHash)
          }
          return txHash
        },
      )

      return transactions
        .map((tx: TransactionResponse) => {
          if (!tx.hash || !tx.from) {
            this.logger.warn(
              `Invalid transaction data in block ${this.blockNumber}: ${tx}`,
            )
            return null
          }

          return {
            hash: tx.hash,
            from: tx.from,
            to: tx.to || null,
            value: tx.value,
            blockNumber: this.blockNumber,
            data: tx.data,
          }
        })
        .filter((tx): tx is TransactionInfo => tx !== null)
    } catch (error) {
      this.logger.error(
        `Failed to get transactions for block ${this.blockNumber}: ${error}`,
      )
      throw error
    }
  }

  private async processTransaction(
    tx: TransactionInfo,
    index: number,
  ): Promise<TransactionInfo> {
    try {
      const receipt = await rpcProvider.getTransactionReceipt(tx.hash)
      if (!receipt)
        throw new Error(`No receipt found for transaction ${tx.hash}`)

      const scanner = new ScanTransaction(tx)
      const result = await scanner.scan()

      this.logger.info(
        `${index}. Transaction processed: ${result.transfers.length} transfers`,
      )
      return { ...tx, result }
    } catch (error) {
      this.logger.error(`Failed to process transaction ${tx.hash}: ${error}`)
      throw error
    }
  }

  private async processTransactionBatch(
    transactions: TransactionInfo[],
    batchSize: number,
  ): Promise<TransactionInfo[]> {
    const results: TransactionInfo[] = []

    for (let i = 0; i < transactions.length; i += batchSize) {
      const batch = transactions.slice(i, i + batchSize)
      const batchResults = await Promise.all(
        batch.map((tx, idx) => this.processTransaction(tx, idx + i)),
      )
      results.push(...batchResults)
    }

    return results
  }

  public async scan(): Promise<{
    status: BlockScanStatus
    transections: TransactionInfo[]
  }> {
    try {
      const existingStatus = await this.getBlockScanStatus()
      if (
        existingStatus?.status === BlockScanStatus.SCANNED &&
        !this.options.forceScan
      ) {
        this.logger.info(`Block ${this.blockNumber} already scanned`)
        return { status: existingStatus.status, transections: [] }
      }

      await this.setBlockScanStatus(BlockScanStatus.RUNNING)
      const transactions = await this.getBlockTransactions()

      this.logger.info(
        `Block ${this.blockNumber} Transactions: ${transactions.length}`,
      )

      const processedTransactions = await this.processTransactionBatch(
        transactions,
        this.options.batchSize || 10,
      )

      const finalStatus: BlockScanInfo = {
        blockNumber: this.blockNumber,
        status: BlockScanStatus.SCANNED,
        timestamp: Date.now(),
        transactionCount: processedTransactions.length,
      }
      await this.setBlockScanStatus(BlockScanStatus.SCANNED, finalStatus)

      return { status: finalStatus.status, transections: processedTransactions }
    } catch (error) {
      const errorStatus: BlockScanInfo = {
        blockNumber: this.blockNumber,
        status: BlockScanStatus.FAILED,
        timestamp: Date.now(),
        error: error instanceof Error ? error.message : String(error),
      }
      await this.setBlockScanStatus(BlockScanStatus.FAILED, errorStatus)

      this.logger.error(`Failed to scan block ${this.blockNumber}: ${error}`)
      throw error
    }
  }
}

export default ScanBlock
