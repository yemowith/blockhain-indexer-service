import task from '../../core/tasks/task'

const checkBlocks = async (args: any) => {
  return await task('check-blocks', args, async (args: any) => {
    return {
      success: true,
    }
  })
}

export default checkBlocks
