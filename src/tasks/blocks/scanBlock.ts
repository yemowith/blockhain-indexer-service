import ScanBlock from '@/libs/scan/scanBlock'

const scanBlockTask = async (args: any) => {
  return await task('basic-task', args, async (args: any) => {
    const scanBlock = new ScanBlock(17000010, {
      forceScan: false,
      batchSize: 100,
    })

    await scanBlock.scan()

    return {
      success: true,
    }
  })
}

export default scanBlockTask
