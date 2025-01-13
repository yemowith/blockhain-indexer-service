import { TransferType } from '@prisma/client'

export interface AnalyzeResult {
  success: boolean
  to: string
  from: string
  value: number
  tokenTransfers: TokenTransfer[]
  blockNumber: number
  transactionHash: string
}

export enum Transfer_Type {
  ETH_TRANSFER = 'ETH_TRANSFER',
  ERC20_TRANSFER = 'ERC20_TRANSFER',
  ERC20_APPROVAL = 'ERC20_APPROVAL',
  ERC721_TRANSFER = 'ERC721_TRANSFER',
  ERC1155_TRANSFER_SINGLE = 'ERC1155_TRANSFER_SINGLE',
  ERC1155_TRANSFER_BATCH = 'ERC1155_TRANSFER_BATCH',
}

export type TokenTransfer = {
  type: Transfer_Type | any
  from: string
  to: string
  value: number | string
  tokenAddress: string
}
