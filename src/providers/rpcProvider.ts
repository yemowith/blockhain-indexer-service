import { ethers } from 'ethers'
import { RPC_URL } from '../config'
import ERC20_ABI from '../data/ERC20_ABI'
import TaskQueue from '../core/libs/TaskQueue'
import retryWithDelay from '../core/libs/Retryer'

// Initialize the provider
const provider = new ethers.JsonRpcProvider(RPC_URL)

const rpcProvider = {
  scanBlock: async (blockNumber: number): Promise<void> => {
    try {
      const block = await retryWithDelay(
        () => provider.getBlock(blockNumber),
        3,
        1000,
      )
      console.log('Scanned Block:', block)
    } catch (error) {
      console.error(`Error scanning block ${blockNumber}:`, error)
    }
  },

  getBlock: async (blockNumber: number): Promise<ethers.Block | null> => {
    try {
      return await retryWithDelay(() => provider.getBlock(blockNumber), 3, 1000)
    } catch (error) {
      console.error(`Error fetching block ${blockNumber}:`, error)
      return null
    }
  },

  getTransaction: async (
    transactionHash: string,
  ): Promise<ethers.TransactionResponse | null> => {
    try {
      return await retryWithDelay(
        () => provider.getTransaction(transactionHash),
        3,
        1000,
      )
    } catch (error) {
      console.error(`Error fetching transaction ${transactionHash}:`, error)
      return null
    }
  },

  getTransactionReceipt: async (
    transactionHash: string,
  ): Promise<ethers.TransactionReceipt | null> => {
    try {
      return await retryWithDelay(
        () => provider.getTransactionReceipt(transactionHash),
        3,
        1000,
      )
    } catch (error) {
      console.error(
        `Error fetching transaction receipt ${transactionHash}:`,
        error,
      )
      return null
    }
  },

  getBlockTransactions: async (
    blockNumber: number,
  ): Promise<ethers.TransactionResponse[] | null> => {
    try {
      const block = await retryWithDelay(
        () => provider.getBlock(blockNumber),
        3,
        1000,
      )
      if (!block) {
        console.error(`Block ${blockNumber} not found`)
        return null
      }

      const transactions = await Promise.all(
        block.transactions.map((txHash) =>
          retryWithDelay(() => provider.getTransaction(txHash), 2, 1000),
        ),
      )

      return transactions.filter(
        (tx) => tx !== null,
      ) as ethers.TransactionResponse[]
    } catch (error) {
      console.error(
        `Error fetching transactions for block ${blockNumber}:`,
        error,
      )
      return null
    }
  },

  getLatestBlock: async (): Promise<ethers.Block | null> => {
    try {
      return await retryWithDelay(() => provider.getBlock('latest'), 3, 1000)
    } catch (error) {
      console.error(`Error fetching latest block:`, error)
      return null
    }
  },

  isContract: async (address: string): Promise<boolean> => {
    try {
      const code = await provider.getCode(address)
      return code !== '0x'
    } catch (error) {
      console.error(`Error checking contract status for ${address}:`, error)
      return false
    }
  },

  getTokenInfo: async (
    address: string,
  ): Promise<{
    name: string
    symbol: string
    decimals: number
  }> => {
    try {
      const isContract = await rpcProvider.isContract(address)
      if (!isContract) {
        throw new Error('Not a contract')
      }

      const contract = new ethers.Contract(address, ERC20_ABI, provider)

      return {
        name: await contract.name(),
        symbol: await contract.symbol(),
        decimals: await contract.decimals(),
      }
    } catch (error) {
      console.error(`Error checking if ${address} is ERC-20:`, error)
      throw error
    }
  },
}

export default rpcProvider
