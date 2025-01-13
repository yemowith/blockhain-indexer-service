import Logger from '@/core/helpers/logger'
import { config } from '@/config'

const initGlobals = () => {
  global.logger = new Logger('App')
  global.config = config
}

// Export initialization
export const bootstrap = () => {
  initGlobals()
  // Add other initialization logic
}

// Export common utilities
export * from './types/types'
