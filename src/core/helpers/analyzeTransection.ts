import { ethers } from 'ethers'
import rpcProvider from '../../providers/rpcProvider'

interface ResultTransection {
  success: boolean
  type:
    | 'ETH_TRANSFER'
    | 'ERC20_TRANSFER'
    | 'ERC721_TRANSFER'
    | 'ERC1155_TRANSFER'
    | 'OTHER'
  to: string
  from: string
  value: number
  token?: string
  tokenId?: number
  tokenAddress?: string
  tokenAmount?: number
  tokenSymbol?: string
  blockNumber: number
  transactionHash: string
}

const analyzeTransection = async (transaction: ethers.TransactionResponse) => {
  let result: ResultTransection = {
    success: false,
    type: 'OTHER',
    to: '',
    from: '',
    value: Number(transaction.value),
    blockNumber: transaction.blockNumber || 0,
    transactionHash: transaction.hash,
  }

  const setType = async () => {
    if (transaction.value > 0 && transaction.data === '0x') {
      result.type = 'ETH_TRANSFER'
    }

    let isContract = await rpcProvider.isContract(transaction.to as string)
    if (isContract) {
      result.type = 'ERC20_TRANSFER'
    }
  }

  await setType()

  return result
}

export default analyzeTransection
