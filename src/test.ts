import pgClient from './core/clients/db-pg'
import redisProvider from './providers/redisProvider'
import rpcProvider from './providers/rpcProvider'
import JsonFileUtils from './core/libs/JsonFileUtils'
import { ethers } from 'ethers'
import analyzeTransection from './tasks/blocks/helpers/analyzeTransection'
import scanBlock from './tasks/blocks/scanBlock'
;(async () => {
  await scanBlock({ blockNumber: 45706515 })
})()

//runTask();
