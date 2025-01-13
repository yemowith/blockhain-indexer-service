import task from '../../core/tasks/task'
import { blockScanner } from './helpers/blockScanner'

const scanBlock = async (args: any) => {
  return await task('scan-block', args, async (args: any) => {
    let blockNumber = args.blockNumber
    const result = await blockScanner.scanBlock({
      blockNumber: blockNumber,
    })
    return {
      success: true,
      result: result,
    }
  })
}

export default scanBlock
