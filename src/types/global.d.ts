import { ethers } from 'ethers'
import { Logger } from '../utils/logger'
import * as Constants from '../constants'

declare global {
  var logger: Logger
  var config: typeof config

  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | 'test'
      RPC_URL: string
      // Add other env variables
    }
  }
}

export {}
