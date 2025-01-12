import task from '../../core/tasks/task'

const scanBlock = async (args: any) => {
  return await task('scan-block', args, async (args: any) => {
    return {
      success: true,
    }
  })
}

export default scanBlock
