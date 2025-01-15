import { ethers } from 'ethers'
import { Transfer, Transfer_Type } from '@/types/types'
import EVENT_SIGNATURES from '@/constants/eventSignatures'

export class TokenTransferDetect {
  private checkLog(log: ethers.Log) {
    // Detect ERC-20 Transfer events
    if (log.topics[0] === EVENT_SIGNATURES.ERC20.TRANSFER.topic) {
      const from = `0x${log.topics[1].slice(26)}` // Decode indexed `from`
      const to = `0x${log.topics[2].slice(26)}` // Decode indexed `to`
      const value =
        log.data === '0x' ? '0' : ethers.toBigInt(log.data).toString()

      return {
        type: Transfer_Type.ERC20_TRANSFER,
        from: from,
        to: to,
        value: BigInt(value),
        tokenAddress: log.address,
        blockNumber: log.blockNumber,
      }
    }

    // Detect ERC-20 Approval events
    if (log.topics[0] === EVENT_SIGNATURES.ERC20.APPROVAL.topic) {
      const owner = `0x${log.topics[1].slice(26)}` // Decode indexed `owner`
      const spender = `0x${log.topics[2].slice(26)}` // Decode indexed `spender`
      const value =
        log.data === '0x' ? '0' : ethers.toBigInt(log.data).toString()

      return {
        type: Transfer_Type.ERC20_APPROVAL,
        from: owner,
        to: spender,
        value: BigInt(value),
        tokenAddress: log.address,
        blockNumber: log.blockNumber,
      }
    }

    // Detect ERC-1155 Transfer Single events
    if (log.topics[0] === EVENT_SIGNATURES.ERC1155.TRANSFER_SINGLE.topic) {
      const from = `0x${log.topics[1].slice(26)}` // Decode indexed `from`
      const to = `0x${log.topics[2].slice(26)}` // Decode indexed `to`
      const value =
        log.data === '0x' ? '0' : ethers.toBigInt(log.data).toString()

      return {
        type: Transfer_Type.ERC1155_TRANSFER_SINGLE,
        from: from,
        to: to,
        value: BigInt(value),
        tokenAddress: log.address,
        blockNumber: log.blockNumber,
      }
    }

    // Detect ERC-721 Transfer events
    if (log.topics[0] === EVENT_SIGNATURES.ERC721.TRANSFER.topic) {
      const from = `0x${log.topics[1].slice(26)}` // Decode indexed `from`
      const to = `0x${log.topics[2].slice(26)}` // Decode indexed `to`

      return {
        type: Transfer_Type.ERC721_TRANSFER,
        from: from,
        to: to,
        value: BigInt(1),
        tokenAddress: log.address,
        blockNumber: log.blockNumber,
      }
    }
  }

  public async getTransactionTransfers(
    receipt: ethers.TransactionReceipt,
  ): Promise<Transfer[]> {
    const transfers: Transfer[] = []

    // Loop through logs in the transaction receipt
    for (const log of receipt.logs) {
      try {
        const transfer = this.checkLog(log)
        if (transfer) {
          transfers.push(transfer)
        }
      } catch (error) {
        logger.error(
          `Failed to get transaction transfers for block ${receipt.blockNumber}:`,
        )
      }
    }

    return transfers
  }

  // Helper method to decode address from topic
  private decodeAddress(topic: string): string {
    return `0x${topic.slice(26)}`
  }
}

export default TokenTransferDetect
