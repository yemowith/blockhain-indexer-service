import dbPrismaProvider from '@/core/providers/dbPrismaProvider'
import task from '@/core/tasks/task'
import BatchRunner from '@/libs/operation/batchRunner'

const MAX_RETRIES = 5
const BATCH_TIMEOUT_MS = 3 * 60 * 1000 // 30 minutes

const batchRunTask = async (args: any) => {
  return await task('batch-run', args, async (args: any) => {
    const startTime = Date.now()
    let retryCount = 0

    const findAndRunNextBatch = async () => {
      const batch = await dbPrismaProvider.batch.getFirstPending()
      if (!batch) {
        return null
      }

      logger.info(`Processing batch ${batch.id}`)

      try {
        const batchRunner = new BatchRunner(batch)

        await batchRunner.run()
        return batch
      } catch (error) {
        logger.error(`Failed to process batch ${batch.id}:`, error)
        throw error
      }
    }

    while (true) {
      // Check if we've exceeded the maximum time
      if (Date.now() - startTime > BATCH_TIMEOUT_MS) {
        logger.info('Batch processing timeout reached')
        break
      }

      // Check if we've exceeded max retries
      if (retryCount >= MAX_RETRIES) {
        logger.info(`Maximum retry attempts (${MAX_RETRIES}) reached`)
        break
      }

      try {
        const batch = await findAndRunNextBatch()

        if (!batch) {
          logger.info('No pending batches found')
          break
        }

        logger.info(`Successfully processed batch ${batch.id}`)
        // Reset retry count on successful processing
        retryCount = 0
      } catch (error) {
        retryCount++
        logger.warn(
          `Batch processing failed, attempt ${retryCount} of ${MAX_RETRIES}`,
        )

        // Optional: Add delay between retries
        await new Promise((resolve) => setTimeout(resolve, 5000))
      }
    }

    return {
      success: true,
      message: 'Batch processing completed',
    }
  })
}

export default batchRunTask
