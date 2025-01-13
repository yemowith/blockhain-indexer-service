import { BlockStatus, Tokens, Transfers } from '@prisma/client'
import dbClient from '../core/clients/db-prisma'
import { Transfer_Type } from '../types'

const contracts = {
  createToken: async (
    address: string,
    name: string,
    symbol: string,
    decimals?: number,
  ): Promise<any> => {
    try {
      const result = await dbClient.tokens.upsert({
        where: { address },
        update: {},
        create: { address, name, symbol, decimals },
      })
      return result
    } catch (error) {
      console.error(`Error upserting token with address ${address}:`, error)
      throw error
    }
  },
  tokenIsExist: async (address: string): Promise<boolean> => {
    const token = await dbClient.tokens.findUnique({
      where: { address: address },
    })
    return token !== null
  },
  getToken: async (address: string): Promise<any> => {
    return await dbClient.tokens.findUnique({
      where: { address: address },
    })
  },
}

const transfers = {
  saveTransfer: async (
    from: string,
    to: string,
    tokenAddress: string,
    value: number,
    type: Transfer_Type,
    blockNumber: number,
    transactionHash: string,
  ): Promise<any> => {
    try {
      const result = await dbClient.transfers.upsert({
        where: {
          transactionHash_type_tokenAddress: {
            transactionHash,
            type,
            tokenAddress,
          },
        },
        update: {},
        create: {
          from: from,
          to: to,
          tokenAddress: tokenAddress,
          value: value.toString(),
          blockNumber: blockNumber,
          transactionHash: transactionHash,
          type: type,
        },
      })
      return result
    } catch (error) {
      console.error(
        `Error upserting transfer with transactionHash ${transactionHash}:`,
        error,
      )
      throw error
    }
  },
  saveBulkTransfers: async (transfers: Transfers[]): Promise<any> => {
    return await dbClient.transfers.createMany({
      data: transfers,
      skipDuplicates: true,
    })
  },
}

const blocks = {
  saveBlock: async (blockNumber: number): Promise<any> => {
    return await dbClient.blocks.create({
      data: { blockNumber },
    })
  },
  getBlock: async (
    blockNumber: number,
    transactionHash: string,
  ): Promise<any> => {
    return await dbClient.blocks.findUnique({
      where: { blockNumber },
    })
  },
  updateBlockStatus: async (
    blockNumber: number,
    status: BlockStatus,
  ): Promise<any> => {
    return await dbClient.blocks.upsert({
      where: { blockNumber },
      update: { status },
      create: { blockNumber, status },
    })
  },
  getBlockStatus: async (blockNumber: number): Promise<any> => {
    return await dbClient.blocks.findUnique({
      where: { blockNumber },
    })
  },
}

const tokens = {
  saveBulkTokens: async (
    tokens: {
      address: string
      name: string
      symbol: string
      decimals: number
    }[],
  ): Promise<any> => {
    return await dbClient.tokens.createMany({
      data: tokens,
      skipDuplicates: true,
    })
  },
}

const dbPrismaProvider = { contracts, transfers, blocks, tokens }

export default dbPrismaProvider
