import rpcProvider from '@/core/providers/rpcProvider'
import {
  TransactionResult,
  TransactionInfo,
  Transfer_Type,
  Transfer,
} from '@/types/types'
import { ethers } from 'ethers'
import TokenTransferDetect from './tokenTransferDetect'

export class ScanTransaction {
  private typeTransection: 'ETH_TRANSFER' | 'UNKNOWN' = 'UNKNOWN'

  private transaction: TransactionInfo

  private result: TransactionResult = {
    success: false,
    to: '',
    from: '',
    value: 0,
    transfers: [],
    blockNumber: 0,
    transactionHash: '',
    isEthTransfer: false,
  }

  constructor(transaction: TransactionInfo) {
    this.transaction = transaction
    this.typeTransection = this.isEthTransfer() ? 'ETH_TRANSFER' : 'UNKNOWN'

    this.result.success = true
    this.result.to = this.transaction.to
    this.result.from = this.transaction.from
    this.result.value = Number(this.transaction.value)
    this.result.blockNumber = this.transaction.blockNumber
    this.result.transactionHash = this.transaction.hash
  }

  async getReceipt(): Promise<ethers.TransactionReceipt | null> {
    const receipt = await rpcProvider.getTransactionReceipt(
      this.transaction.hash,
    )
    return receipt
  }

  isEthTransfer(): boolean {
    return (
      this.transaction.value !== BigInt(0) && this.transaction.data === '0x'
    )
  }

  addTransfer(transfer: Transfer): void {
    transfer.to = transfer.to.toLowerCase()
    transfer.from = transfer.from.toLowerCase()
    this.result.transfers.push(transfer)
  }

  async scan(): Promise<TransactionResult> {
    if (this.typeTransection === 'ETH_TRANSFER') {
      this.addTransfer({
        type: Transfer_Type.ETH_TRANSFER,
        from: this.transaction.from,
        to: this.transaction.to,
        value: this.transaction.value,
        blockNumber: this.transaction.blockNumber,
        tokenAddress: config.ADDRESS_ZERO,
      })
      this.result.isEthTransfer = true
      return this.result
    }

    const receipt = await this.getReceipt()

    if (!receipt) {
      this.result.error = 'Transaction receipt not found'
      return this.result
    }

    const tokenTransferDetector = new TokenTransferDetect()
    const transfers = await tokenTransferDetector.getTransactionTransfers(
      receipt,
    )

    this.result.transfers.push(...transfers)

    if (!receipt) {
      this.result.error = 'Transaction receipt not found'
      return this.result
    }

    return this.result
  }
}
