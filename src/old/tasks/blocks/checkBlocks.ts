import { BlockStatus } from '@prisma/client'
import Logger from '../../../core/helpers/logger'
import task from '../../../core/tasks/task'
import rpcProvider from '../../providers/rpcProvider'
import dbPrismaProvider from '../../providers/dbPrismaProvider'

const checkBlocks = async (args: any) => {
  return await task('check-blocks', args, async (args: any) => {
    let logger = new Logger('check-blocks')
    logger.info('Checking blocks...')

    let lastBlock = await rpcProvider.getLatestBlock()

    let lastBlockWithStatus = await dbPrismaProvider.blocks.getLastBlockWithStatus(
      BlockStatus.PENDING,
    )

    console.log(lastBlockWithStatus)

    return {
      success: true,
    }
  })
}

export default checkBlocks
