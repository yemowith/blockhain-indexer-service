import task from '../../core/tasks/task'
import rpcProvider from '../../providers/rpcProvider'

const checkBlocks = async (args: any) => {
  return await task('check-blocks', args, async (args: any) => {
    return {
      success: true,
    }
  })
}

export default checkBlocks
