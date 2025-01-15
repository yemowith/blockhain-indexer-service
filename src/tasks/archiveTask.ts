import dbPrismaProvider from '@/core/providers/dbPrismaProvider'
import task from '@/core/tasks/task'
import ArchiveOperationPlanner from '@/libs/operation/archiveOperationPlanner'

const archiveTask = async (args: any) => {
  return await task('archive-task', args, async (args: any) => {
    await dbPrismaProvider.operation.deleteAll()

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
