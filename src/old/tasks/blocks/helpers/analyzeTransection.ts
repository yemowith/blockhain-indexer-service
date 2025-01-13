import { ethers } from 'ethers'
import rpcProvider from '../../../providers/rpcProvider'
import dbPrismaProvider from '../../../providers/dbPrismaProvider'
import detectTokenTransfersWithTopics from './detectTokenTransfersWithTopics'
import { Transfer_Type } from '@/types/types'
import { AnalyzeResult } from '@/types/types'

const analyzeTransection = async (transaction: ethers.TransactionResponse) => {
  let result: AnalyzeResult = {
    success: false,
    tokenTransfers: [],
    to: transaction.to as string,
    from: transaction.from as string,
    value: Number(transaction.value),
    blockNumber: transaction.blockNumber || 0,
    transactionHash: transaction.hash,
  }

  if (Number(transaction.value) > 0 && transaction.data === '0x') {
    result.tokenTransfers = [
      {
        type: Transfer_Type.ETH_TRANSFER,
        from: transaction.from as string,
        to: transaction.to as string,
        value: Number(transaction.value),
        tokenAddress: config.ADDRESS_ZERO,
      },
    ]
    return result
  }

  const receipt = await rpcProvider.getTransactionReceipt(transaction.hash)

  if (!receipt) {
    return result
  }

  result.tokenTransfers = await detectTokenTransfersWithTopics(receipt)

  return result
}

export default analyzeTransection
