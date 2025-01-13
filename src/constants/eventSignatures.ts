import { keccak256, toUtf8Bytes } from 'ethers'

// ERC20 Event Signatures
export const ERC20_EVENT_SIGNATURES = {
  TRANSFER: {
    name: 'Transfer',
    signature: 'Transfer(address,address,uint256)',
    topic: keccak256(toUtf8Bytes('Transfer(address,address,uint256)')),
  },
  APPROVAL: {
    name: 'Approval',
    signature: 'Approval(address,address,uint256)',
    topic: keccak256(toUtf8Bytes('Approval(address,address,uint256)')),
  },
}

// ERC721 Event Signatures
export const ERC721_EVENT_SIGNATURES = {
  TRANSFER: {
    name: 'Transfer',
    signature: 'Transfer(address,address,uint256)',
    topic: keccak256(toUtf8Bytes('Transfer(address,address,uint256)')),
  },
  APPROVAL: {
    name: 'Approval',
    signature: 'Approval(address,address,uint256)',
    topic: keccak256(toUtf8Bytes('Approval(address,address,uint256)')),
  },
  APPROVAL_FOR_ALL: {
    name: 'ApprovalForAll',
    signature: 'ApprovalForAll(address,address,bool)',
    topic: keccak256(toUtf8Bytes('ApprovalForAll(address,address,bool)')),
  },
}

// ERC1155 Event Signatures
export const ERC1155_EVENT_SIGNATURES = {
  TRANSFER_SINGLE: {
    name: 'TransferSingle',
    signature: 'TransferSingle(address,address,address,uint256,uint256)',
    topic: keccak256(
      toUtf8Bytes('TransferSingle(address,address,address,uint256,uint256)'),
    ),
  },
  TRANSFER_BATCH: {
    name: 'TransferBatch',
    signature: 'TransferBatch(address,address,address,uint256[],uint256[])',
    topic: keccak256(
      toUtf8Bytes('TransferBatch(address,address,address,uint256[],uint256[])'),
    ),
  },
  URI: {
    name: 'URI',
    signature: 'URI(string,uint256)',
    topic: keccak256(toUtf8Bytes('URI(string,uint256)')),
  },
  APPROVAL_FOR_ALL: {
    name: 'ApprovalForAll',
    signature: 'ApprovalForAll(address,address,bool)',
    topic: keccak256(toUtf8Bytes('ApprovalForAll(address,address,bool)')),
  },
}

// ERC777 Event Signatures
export const ERC777_EVENT_SIGNATURES = {
  SENT: {
    name: 'Sent',
    signature: 'Sent(address,address,address,uint256,bytes,bytes)',
    topic: keccak256(
      toUtf8Bytes('Sent(address,address,address,uint256,bytes,bytes)'),
    ),
  },
  MINTED: {
    name: 'Minted',
    signature: 'Minted(address,address,uint256,bytes,bytes)',
    topic: keccak256(
      toUtf8Bytes('Minted(address,address,uint256,bytes,bytes)'),
    ),
  },
  BURNED: {
    name: 'Burned',
    signature: 'Burned(address,address,uint256,bytes,bytes)',
    topic: keccak256(
      toUtf8Bytes('Burned(address,address,uint256,bytes,bytes)'),
    ),
  },
  AUTHORIZED_OPERATOR: {
    name: 'AuthorizedOperator',
    signature: 'AuthorizedOperator(address,address)',
    topic: keccak256(toUtf8Bytes('AuthorizedOperator(address,address)')),
  },
  REVOKED_OPERATOR: {
    name: 'RevokedOperator',
    signature: 'RevokedOperator(address,address)',
    topic: keccak256(toUtf8Bytes('RevokedOperator(address,address)')),
  },
}

// Common DeFi Event Signatures
export const DEFI_EVENT_SIGNATURES = {
  SWAP: {
    name: 'Swap',
    signature: 'Swap(address,uint256,uint256,uint256,uint256,address)',
    topic: keccak256(
      toUtf8Bytes('Swap(address,uint256,uint256,uint256,uint256,address)'),
    ),
  },
  SYNC: {
    name: 'Sync',
    signature: 'Sync(uint112,uint112)',
    topic: keccak256(toUtf8Bytes('Sync(uint112,uint112)')),
  },
  MINT: {
    name: 'Mint',
    signature: 'Mint(address,uint256,uint256)',
    topic: keccak256(toUtf8Bytes('Mint(address,uint256,uint256)')),
  },
  BURN: {
    name: 'Burn',
    signature: 'Burn(address,uint256,uint256,address)',
    topic: keccak256(toUtf8Bytes('Burn(address,uint256,uint256,address)')),
  },
}

// Utility functions
export const isTransferEvent = (topic: string): boolean => {
  return [
    ERC20_EVENT_SIGNATURES.TRANSFER.topic,
    ERC721_EVENT_SIGNATURES.TRANSFER.topic,
    ERC1155_EVENT_SIGNATURES.TRANSFER_SINGLE.topic,
    ERC1155_EVENT_SIGNATURES.TRANSFER_BATCH.topic,
  ].includes(topic)
}

export const getEventSignatureByTopic = (topic: string) => {
  const allSignatures = {
    ...ERC20_EVENT_SIGNATURES,
    ...ERC721_EVENT_SIGNATURES,
    ...ERC1155_EVENT_SIGNATURES,
    ...ERC777_EVENT_SIGNATURES,
    ...DEFI_EVENT_SIGNATURES,
  }

  return Object.values(allSignatures).find((sig) => sig.topic === topic)
}

// Combined event signatures for easy filtering
export const TRANSFER_EVENT_SIGNATURES = {
  ERC20_TRANSFER: ERC20_EVENT_SIGNATURES.TRANSFER,
  ERC721_TRANSFER: ERC721_EVENT_SIGNATURES.TRANSFER,
  ERC1155_SINGLE: ERC1155_EVENT_SIGNATURES.TRANSFER_SINGLE,
  ERC1155_BATCH: ERC1155_EVENT_SIGNATURES.TRANSFER_BATCH,
}

// Export all signatures
export const EVENT_SIGNATURES = {
  ERC20: ERC20_EVENT_SIGNATURES,
  ERC721: ERC721_EVENT_SIGNATURES,
  ERC1155: ERC1155_EVENT_SIGNATURES,
  ERC777: ERC777_EVENT_SIGNATURES,
  DEFI: DEFI_EVENT_SIGNATURES,
  TRANSFER: TRANSFER_EVENT_SIGNATURES,
}

// Interface for event signature
export interface EventSignature {
  name: string
  signature: string
  topic: string
}

// Helper function to create custom event signature
export function createEventSignature(eventString: string): EventSignature {
  const topic = keccak256(toUtf8Bytes(eventString))
  return {
    name: eventString.split('(')[0],
    signature: eventString,
    topic,
  }
}

export default EVENT_SIGNATURES
