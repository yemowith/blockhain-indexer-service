import parquet from '@dsnp/parquetjs'

class ParquetHealthChecker {
  static async checkHealth(
    filePath: string,
  ): Promise<{
    rowCount: number
    schema: any
    canBeUploaded: boolean
  }> {
    let result: {
      rowCount: number
      schema: any
      canBeUploaded: boolean
    } = {
      rowCount: 0,
      schema: {},
      canBeUploaded: true,
    }

    try {
      let reader = await parquet.ParquetReader.openFile(filePath)
      let rowCount = reader.getRowCount()
      let schema = reader.getSchema()

      if (rowCount.toNumber() === 0) {
        result.canBeUploaded = false
      }

      if (Object.keys(schema.fields).length === 0) {
        result.canBeUploaded = false
      }

      result.rowCount = rowCount.toNumber()
      result.schema = schema

      await reader.close()
    } catch (error) {
      logger.error('Error checking parquet file health', {
        filePath,
        error,
      })
      result.canBeUploaded = false
    }

    return result
  }
}

export default ParquetHealthChecker
