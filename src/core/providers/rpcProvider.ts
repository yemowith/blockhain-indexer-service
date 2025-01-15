import { ethers } from 'ethers'

import { ERC20_ABI } from '@/constants/abis'
import retry from '@/core/libs/retry'

// Types
interface RpcConfig {
  url: string
  timeout?: number
  retries?: number
  retryDelay?: number
}

interface TokenInfo {
  address: string
  name: string
  symbol: string
  decimals: number
}

type BlockTag = number | string

// Error classes
class RpcError extends Error {
  constructor(message: string, public readonly code?: string) {
    super(message)
    this.name = 'RpcError'
  }
}

// Provider Options Type
interface ExtendedProviderOptions extends ethers.JsonRpcApiProviderOptions {
  // Additional options
  headers?: Record<string, string>
  skipFetchSetup?: boolean
}

class RpcProviderClass {
  private provider: ethers.JsonRpcProvider
  private config: Required<RpcConfig>

  constructor(config: RpcConfig) {
    this.config = {
      timeout: 30000,
      retries: 3,
      retryDelay: 1000,
      ...config,
    }

    // Create provider with correct options
    const providerOptions: ExtendedProviderOptions = {
      /*
      polling: true,
      staticNetwork: true,
      // Add any custom headers if needed
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      */
    }

    this.provider = new ethers.JsonRpcProvider(
      this.config.url,
      undefined,
      providerOptions,
    )

    this.provider.pollingInterval = this.config.timeout
  }

  // Private helper methods
  private async retryWrapper<T>(
    operation: () => Promise<T>,
    context: string,
  ): Promise<T> {
    try {
      return await retry(operation, this.config.retries, this.config.retryDelay)
    } catch (error) {
      // @ts-ignore
      logger.error(`${context} failed`)
      // @ts-ignore
      throw new RpcError(`${context} failed: ${error.message}`)
    }
  }

  // Block related methods
  async getBlock(
    blockTag: BlockTag,
    includeTransactions = false,
  ): Promise<ethers.Block | null> {
    return this.retryWrapper(
      () => this.provider.getBlock(blockTag, includeTransactions),
      `Get block ${blockTag}`,
    )
  }

  async getLatestBlock(includeTransactions = false) {
    return this.retryWrapper(
      () => this.provider.getBlock('latest', includeTransactions),
      'Get latest block',
    )
  }

  async getBlockNumber() {
    return this.retryWrapper(
      () => this.provider.getBlockNumber(),
      'Get block number',
    )
  }

  // Transaction related methods
  async getTransaction(hash: string) {
    return this.retryWrapper(
      () => this.provider.getTransaction(hash),
      `Get transaction ${hash}`,
    )
  }

  async getTransactionReceipt(hash: string) {
    return this.retryWrapper(
      () => this.provider.getTransactionReceipt(hash),
      `Get transaction receipt ${hash}`,
    )
  }

  async getTransactionCount(address: string, blockTag: BlockTag = 'latest') {
    return this.retryWrapper(
      () => this.provider.getTransactionCount(address, blockTag),
      `Get transaction count for ${address}`,
    )
  }

  // Block transactions
  async getBlockTransactions(blockTag: BlockTag) {
    const block = await this.getBlock(blockTag, true)
    if (!block) {
      throw new RpcError(`Block ${blockTag} not found`)
    }

    return block.transactions
  }

  // Contract related methods
  async getCode(address: string, blockTag: BlockTag = 'latest') {
    return this.retryWrapper(
      () => this.provider.getCode(address, blockTag),
      `Get code for ${address}`,
    )
  }

  async isContract(address: string): Promise<boolean> {
    const code = await this.getCode(address)
    return code !== '0x'
  }

  async getTokenInfo(address: string): Promise<TokenInfo> {
    const isContract = await this.isContract(address)
    if (!isContract) {
      throw new RpcError(`Address ${address} is not a contract`)
    }

    const contract = new ethers.Contract(address, ERC20_ABI, this.provider)

    try {
      const [name, symbol, decimals] = await Promise.all([
        contract.name(),
        contract.symbol(),
        contract.decimals(),
      ])

      return {
        address,
        name,
        symbol,
        decimals,
      }
    } catch (error) {
      throw new RpcError(
        // @ts-ignore
        `Failed to get token info for ${address}: ${error.message}`,
      )
    }
  }

  // Balance related methods
  async getBalance(address: string, blockTag: BlockTag = 'latest') {
    return this.retryWrapper(
      () => this.provider.getBalance(address, blockTag),
      `Get balance for ${address}`,
    )
  }

  async getTokenBalance(tokenAddress: string, address: string) {
    const contract = new ethers.Contract(tokenAddress, ERC20_ABI, this.provider)
    return this.retryWrapper(
      () => contract.balanceOf(address),
      `Get token balance for ${address} on ${tokenAddress}`,
    )
  }

  // Batch operations
  async getMultipleTransactions(hashes: string[]) {
    const promises = hashes.map((hash) => this.getTransaction(hash))
    return Promise.all(promises)
  }

  async getMultipleBalances(addresses: string[]) {
    const promises = addresses.map((address) => this.getBalance(address))
    return Promise.all(promises)
  }

  async getMultipleTokenBalances(tokenAddress: string, addresses: string[]) {
    const contract = new ethers.Contract(tokenAddress, ERC20_ABI, this.provider)
    const promises = addresses.map((address) =>
      this.retryWrapper(
        () => contract.balanceOf(address),
        `Get token balance for ${address}`,
      ),
    )
    return Promise.all(promises)
  }

  // Provider utilities
  async waitForTransaction(hash: string, confirmations = 1, timeout = 60000) {
    return this.retryWrapper(
      () => this.provider.waitForTransaction(hash, confirmations, timeout),
      `Wait for transaction ${hash}`,
    )
  }

  getProvider() {
    return this.provider
  }

  // Network related methods
  async getNetwork() {
    return this.retryWrapper(() => this.provider.getNetwork(), 'Get network')
  }

  async getGasPrice() {
    return this.retryWrapper(() => this.provider.getFeeData(), 'Get gas price')
  }
}

// Create instance with environment variables
const rpcProvider = new RpcProviderClass({
  url: process.env.RPC_URL!,
  timeout: 30000,
  retries: 5,
  retryDelay: 1000,
})

export default rpcProvider
