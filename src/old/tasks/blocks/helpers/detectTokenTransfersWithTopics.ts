import { ethers } from 'ethers'
import { TokenTransfer, Transfer_Type } from '../../../../types/types'

// Event signatures
const ERC20_TRANSFER_TOPIC =
  '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'
const ERC20_APPROVAL_TOPIC =
  '0x8c5be1e5ebec7d5bd14f714f42e63e6f669f5a6a6ffbd235a34ecf7a9c9c8a11'
const ERC1155_TRANSFER_SINGLE_TOPIC =
  '0xc3d58168c5bcd8e85c283f7e3ad44b14f5fa557bbb7d5d1f58282c5df62c9b5c'
const ERC1155_TRANSFER_BATCH_TOPIC =
  '0x4a39dc06d4c0dbc64b70b7c8dcc629ba3b52d5bfc95359a6772e5d5399b7b610'
const ERC721_TRANSFER_TOPIC =
  '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'

async function detectTokenTransfersWithTopics(
  receipt: ethers.TransactionReceipt,
) {
  const transfers: TokenTransfer[] = []

  // Loop through logs in the transaction receipt
  for (const log of receipt.logs) {
    // Detect ERC-20 / ERC-721 Transfer events
    if (log.topics[0] === ERC20_TRANSFER_TOPIC) {
      const from = `0x${log.topics[1].slice(26)}` // Decode indexed `from`
      const to = `0x${log.topics[2].slice(26)}` // Decode indexed `to`
      const value = ethers.toBigInt(log.data).toString() // Decode non-indexed `value`

      transfers.push({
        type: Transfer_Type.ERC20_TRANSFER,
        from: from,
        to: to,
        value: Number(value),
        tokenAddress: log.address,
      })
    }

    // Detect ERC-20 Approval events
    if (log.topics[0] === ERC20_APPROVAL_TOPIC) {
      const owner = `0x${log.topics[1].slice(26)}` // Decode indexed `owner`
      const spender = `0x${log.topics[2].slice(26)}` // Decode indexed `spender`
      const value = ethers.toBigInt(log.data).toString() // Decode non-indexed `value`

      transfers.push({
        type: Transfer_Type.ERC20_APPROVAL,
        from: owner,
        to: spender,
        value: Number(value),
        tokenAddress: log.address,
      })
    }

    // Detect ERC-1155 Transfer events
    if (log.topics[0] === ERC1155_TRANSFER_SINGLE_TOPIC) {
      const from = `0x${log.topics[1].slice(26)}` // Decode indexed `from`
      const to = `0x${log.topics[2].slice(26)}` // Decode indexed `to`
      const value = ethers.toBigInt(log.data).toString() // Decode non-indexed `value`

      transfers.push({
        type: Transfer_Type.ERC1155_TRANSFER_SINGLE,
        from: from,
        to: to,
        value: Number(value),
        tokenAddress: log.address,
      })
    }

    // Detect ERC-721 Transfer events
    if (log.topics[0] === ERC721_TRANSFER_TOPIC) {
      const from = `0x${log.topics[1].slice(26)}` // Decode indexed `from`
      const to = `0x${log.topics[2].slice(26)}` // Decode indexed `to`

      transfers.push({
        type: Transfer_Type.ERC721_TRANSFER,
        from: from,
        to: to,
        value: 1,
        tokenAddress: log.address,
      })
    }
  }

  return transfers
}

export default detectTokenTransfersWithTopics
