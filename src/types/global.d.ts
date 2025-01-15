import { ethers } from 'ethers'

import * as Constants from '../constants'
import { task } from '../core/tasks/task'
import Logger from '@/core/helpers/logger'
import { Config } from '@/config/config'

declare global {
  var logger: Logger
  var config: Config
  var task: typeof Task
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | 'test'
    }
    interface Global {
      logger: Logger
      config: any
      task: typeof Task
    }
  }
}

export {}
