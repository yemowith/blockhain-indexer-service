import pgClient from './core/clients/db-pg'
import redisProvider from './providers/redisProvider'
import rpcProvider from './providers/rpcProvider'
import JsonFileUtils from './core/libs/JsonFileUtils'
import { ethers } from 'ethers'
import analyzeTransection from './core/helpers/analyzeTransection'
;(async () => {
  const getTransactions = async () => {
    let latestBlock = await rpcProvider.getLatestBlock()
    let blockNumber = latestBlock?.number

    if (!blockNumber) {
      console.log('No block number found')
      return
    }

    let transactions = await rpcProvider.getBlockTransactions(blockNumber)

    return transactions
  }

  // Write data to JSON file
  // await JsonFileUtils.writeJson('test-transections.json', transactions)
  // console.log('Data successfully written to file.')

  const readData = await JsonFileUtils.readJson<ethers.TransactionResponse[]>(
    'test-transections.json',
  )

  for (const transaction of readData) {
    const result = await analyzeTransection(transaction)
    console.log(result)
  }
})()

//runTask();
