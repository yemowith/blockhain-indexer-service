import task from '@/core/tasks/task'
import ArchiveOperationPlanner from '@/libs/operation/archiveOperationPlanner'
import cleanData from '@/libs/operation/cleanData'
import s3Provider from '../../dist/core/providers/s3Provider'

const archiveTask = async (args: any) => {
  return await task('archive-task', args, async (args: any) => {
    await cleanData()

    const archiveOperationPlanner = new ArchiveOperationPlanner({
      startBlock: 0,
      batchSize: 10000,
      disableSaveOperation: false,
    })

    const operationInfo = await archiveOperationPlanner.run()

    return {
      success: true,
      operationInfo: operationInfo.info,
    }
  })
}

export default archiveTask
