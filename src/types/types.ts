export interface BatchResult {
  blocksDone: number
  blocksFailed: number
  blocksToScan: number
  countBlocks: number
  progressPercentage: number
  transfersCount?: number
  walletsCount?: number
  [key: string]: any
}

export interface TransactionResult {
  success: boolean
  to: string
  from: string
  value: number
  transfers: Transfer[]
  blockNumber: number
  transactionHash: string
  isEthTransfer?: boolean
  error?: string
  status?: boolean
}

export enum Transfer_Type {
  ETH_TRANSFER = 'ETH_TRANSFER',
  ERC20_TRANSFER = 'ERC20_TRANSFER',
  ERC20_APPROVAL = 'ERC20_APPROVAL',
  ERC721_TRANSFER = 'ERC721_TRANSFER',
  ERC1155_TRANSFER_SINGLE = 'ERC1155_TRANSFER_SINGLE',
  ERC1155_TRANSFER_BATCH = 'ERC1155_TRANSFER_BATCH',
}

export type Transfer = {
  type: Transfer_Type | any
  from: string
  to: string
  value: bigint
  tokenAddress: string
  blockNumber: number
}

export type TransferDB = {
  txHash?: string
  tType: Transfer_Type | any
  tFrom: string
  tTo: string
  tValue: bigint
  tTokenAdrs: string
  blckNum: number
}

export type Task = {
  name: string
  task: (args: any) => Promise<any>
}

// Types
export enum BlockScanStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  SCANNED = 'SCANNED',
  FAILED = 'FAILED',
}

export interface BlockScanInfo {
  blockNumber: number
  status: BlockScanStatus
  timestamp: number
  transactionCount?: number
  error?: string
  lastProcessedTx?: string
}

export interface TransactionInfo {
  hash: string
  from: string
  to: string
  value: bigint
  blockNumber: number
  status?: boolean | null
  type?:
    | 'ETH_TRANSFER'
    | 'ERC20_TRANSFER'
    | 'ERC721_TRANSFER'
    | 'ERC1155_TRANSFER'
    | 'UNKNOWN'
  data: string
  result?: TransactionResult
}

export type ContainerInstanceType = {
  permutations(): number
  getPermutationByIndex: (index: number) => MnemonicInstanceType
  getMnemonic: () => MnemonicInstanceType
  getContainerId: () => string
}

export type MnemonicInstanceType = {
  toAlphabetObject: () => Record<string, string>
  toObject: () => Record<string, string>
  toString: () => string
  validate: () => boolean
  toArray: () => string[]
}

export type ContainerRowData = {
  containerId: string
  slug: string
  createdAt: string
  isStarted: boolean
  isDone: boolean
  status: string
  mnemonic: string
  [key: string]: any
}

export type RowInstanceType = {
  getId: () => string
  isStarted: () => boolean
  isDone: () => boolean
  status: () => string
  setStatus: (status: string) => Promise<void>
  setAsStarted: () => Promise<void>
  setAsDone: () => Promise<void>
  addData: (key: string, value: any) => Promise<void>
  getData: (key: string) => Promise<any>
  get: () => Promise<ContainerRowData>
  save: () => Promise<void>
  getMnemonic?: () => MnemonicInstanceType // Optional, based on the root-service implementation
  getSlug: () => string
}

export type BatchBase = {
  id: number // Benzersiz ID
  startBlock: number
  endBlock: number
  count: number
}

export type Batch = {
  status: BatchStatus
  operationId: string
} & BatchBase

export type BatchStatus = 'pending' | 'completed' | 'failed' | 'running'

export type ArchiveOperationStatus =
  | 'pending'
  | 'completed'
  | 'failed'
  | 'running'

export type ArchiveOperation = {
  totalBatches: number
  totalBatchesCompleted: number
  totalBatchesFailed: number
  totalBatchesPending: number
  startBlock: number
  endBlock: number
  lastBlock: number
  batchSize: number
  lastProcessedBlock: number
  totalBlocks: number
  status: ArchiveOperationStatus
}

export type ArchiveOperationInfo = {
  info: ArchiveOperation
  batches: Batch[]
}

export interface IExporter {
  init(): Promise<void>
  beforeBatchRun(): Promise<void>
  afterBatchRun(
    result: BatchResult,
  ): Promise<{
    [key: string]: any
  }>
  afterBlockScan(result: {
    blockNumber: number
    status: BlockScanStatus
    transections: TransactionInfo[]
  }): Promise<{
    [key: string]: any
  }>
}
