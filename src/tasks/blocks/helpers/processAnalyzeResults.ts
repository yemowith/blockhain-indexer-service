import { TransferType } from '@prisma/client'
import dbPrismaProvider from '../../../providers/dbPrismaProvider'
import { AnalyzeResult, TokenTransfer } from '../../../types'
import rpcProvider from '../../../providers/rpcProvider'
import { ADDRESS_ZERO } from '../../../config'

const saveTokens = async (transfers: TokenTransfer[]) => {
  let tokens: {
    name: string
    symbol: string
    decimals: any
    address: string
  }[] = []
  for (const transfer of transfers) {
    if (
      transfer.tokenAddress == ADDRESS_ZERO ||
      transfer.tokenAddress == null
    ) {
      continue
    }

    if (
      transfer.type == TransferType.ERC20_TRANSFER ||
      transfer.type == TransferType.ERC20_APPROVAL ||
      transfer.type == TransferType.ERC721_TRANSFER
    ) {
      try {
        const token = await rpcProvider.getTokenInfo(transfer.tokenAddress)
        tokens.push({
          address: transfer.tokenAddress,
          name: token.name,
          symbol: token.symbol,
          decimals: Number(token.decimals),
        })
      } catch (error) {
        console.error(
          `Error getting token info for ${transfer.tokenAddress}:`,
          error,
        )
      }
    }
  }

  await dbPrismaProvider.tokens.saveBulkTokens(tokens)

  console.log('Saving tokens:', tokens.length)
}

const processAnalyzeResults = async (result: AnalyzeResult) => {
  let rapor = {
    total: 0,
    eth_transfers: 0,
    erc20_transfers: 0,
    erc721_transfers: 0,
    erc1155_transfers: 0,
    others: 0,
  }

  const transfers: any[] = []

  for (const tokenTransfer of result.tokenTransfers) {
    let transfer: any = {
      blockNumber: result.blockNumber,
      transactionHash: result.transactionHash,
      from: result.from,
      to: result.to,
      value: result.value,
      type: null,
      tokenAddress: ADDRESS_ZERO,
    }
    switch (tokenTransfer.type) {
      case 'ETH_TRANSFER':
        rapor.eth_transfers += 1
        transfer.type = TransferType.ETH_TRANSFER
        break
      case 'ERC20_TRANSFER':
        rapor.erc20_transfers += 1
        transfer.tokenAddress = tokenTransfer.tokenAddress
        transfer.value = tokenTransfer.value
        transfer.from = tokenTransfer.from
        transfer.to = tokenTransfer.to
        transfer.type = TransferType.ERC20_TRANSFER
        break
      case 'ERC721_TRANSFER':
        rapor.erc721_transfers += 1
        transfer.tokenAddress = tokenTransfer.tokenAddress
        transfer.value = tokenTransfer.value
        transfer.from = tokenTransfer.from
        transfer.to = tokenTransfer.to
        transfer.type = TransferType.ERC721_TRANSFER
        break
      case 'ERC1155_TRANSFER_SINGLE':
        rapor.erc1155_transfers += 1
        transfer.type = TransferType.ERC1155_TRANSFER_SINGLE
        break
      case 'ERC1155_TRANSFER_BATCH':
        rapor.erc1155_transfers += 1
        transfer.type = TransferType.ERC1155_TRANSFER_BATCH
        break
    }

    transfer.value = transfer.value.toString()

    if (transfer.type) {
      transfers.push(transfer)
    }
  }

  try {
    // await saveTokens(transfers)
  } catch (error) {
    console.error('Error saving tokens:', error)
  }

  try {
    await dbPrismaProvider.transfers.saveBulkTransfers(transfers)
  } catch (error) {
    console.error('Error saving transfers:', error)
  }

  return rapor
}

export default processAnalyzeResults
