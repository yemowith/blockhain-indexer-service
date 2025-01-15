import task from '@/core/tasks/task'

const batchRunTask = async (args: any) => {
  return await task('run-batch', args, async (args: any) => {
    return {
      success: true,
    }
  })
}

export default batchRunTask
