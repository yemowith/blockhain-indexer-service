import dotenv from 'dotenv'
dotenv.config()

import Logger from '@/core/helpers/logger'
import { Config, config } from '@/config/config'
import Task from './tasks/task'

declare global {
  var logger: Logger
  var config: Config
  var task: typeof Task
}

const initGlobals = () => {
  global.logger = new Logger('App')
  global.config = config
}

export const bootstrap = () => {
  initGlobals()
}
