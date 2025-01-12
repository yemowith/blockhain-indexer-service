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
