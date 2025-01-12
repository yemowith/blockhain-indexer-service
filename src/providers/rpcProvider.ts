import { ethers } from 'ethers'
import { RPC_URL } from '../config'
import ERC20_ABI from '../data/ERC20_ABI'

// Initialize the provider
const provider = new ethers.JsonRpcProvider(RPC_URL)

const rpcProvider = {
  // Scan a block for basic details
  scanBlock: async (blockNumber: number): Promise<void> => {
    try {
      const block = await provider.getBlock(blockNumber)
      console.log('Scanned Block:', block)
    } catch (error) {
      console.error(`Error scanning block ${blockNumber}:`, error)
    }
  },

  // Get basic block data
  getBlock: async (blockNumber: number): Promise<ethers.Block | null> => {
    try {
      const block = await provider.getBlock(blockNumber)
      return block
    } catch (error) {
      console.error(`Error fetching block ${blockNumber}:`, error)
      return null
    }
  },

  // Get transaction details by transaction hash
  getTransaction: async (
    transactionHash: string,
  ): Promise<ethers.TransactionResponse | null> => {
    try {
      const transaction = await provider.getTransaction(transactionHash)
      return transaction
    } catch (error) {
      console.error(`Error fetching transaction ${transactionHash}:`, error)
      return null
    }
  },

  // Get all transactions in a block
  getBlockTransactions: async (
    blockNumber: number,
  ): Promise<ethers.TransactionResponse[] | null> => {
    try {
      const block = await provider.getBlock(blockNumber)
      if (!block) {
        console.error(`Block ${blockNumber} not found`)
        return null
      }

      const transactions = await Promise.all(
        block.transactions.map((txHash) => provider.getTransaction(txHash)),
      )

      const validTransactions = transactions.filter(
        (tx) => tx !== null,
      ) as ethers.TransactionResponse[]

      return validTransactions
    } catch (error) {
      console.error(
        `Error fetching transactions for block ${blockNumber}:`,
        error,
      )
      return null
    }
  },
  getLatestBlock: async (): Promise<ethers.Block | null> => {
    const block = await provider.getBlock('latest')
    return block
  },
  isContract: async (address: string): Promise<boolean> => {
    const code = await provider.getCode(address)
    return code !== '0x'
  },
  isERC20: async (address: string): Promise<boolean> => {
    try {
      // Ensure the address is a contract
      const isContract = await rpcProvider.isContract(address)
      if (!isContract) return false

      // Create a contract instance with the minimal ERC-20 ABI
      const contract = new ethers.Contract(address, ERC20_ABI, provider)
      if (!contract) return false

      return true
    } catch (error) {
      // If any function fails, the contract is likely not an ERC-20
      console.error(`Error checking if ${address} is ERC-20:`, error)
      return false
    }
  },
}

export default rpcProvider
