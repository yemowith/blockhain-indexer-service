import task from '@/core/tasks/task'

const basicTask = async (args: any) => {
  return await task('basic-task', args, async (args: any) => {
    return {
      success: true,
    }
  })
}

export default basicTask
