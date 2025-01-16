import parquetjs, { ParquetWriter } from '@dsnp/parquetjs'

class ParquetFileWriter {
  private filePath: string
  private parquetWriter: ParquetWriter | null = null
  private schema: any
  constructor(filePath: string, schema: any) {
    this.filePath = filePath
    this.schema = schema
  }

  async init() {
    const schema = new parquetjs.ParquetSchema(this.schema)

    this.parquetWriter = await parquetjs.ParquetWriter.openFile(
      schema,
      this.filePath,
    )
  }

  validateRecord(record: any) {
    if (typeof record.tValue === 'bigint') {
      record.tValue = record.tValue.toString()
    }
    if (typeof record.tValue === 'number') {
      record.tValue = record.tValue.toString()
    }

    return record
  }

  async writeRecords(records: any[]) {
    if (!this.parquetWriter) {
      throw new Error('Parquet writer not initialized')
    }
    for (const record of records) {
      await this.parquetWriter.appendRow(this.validateRecord(record))
    }
  }

  async close() {
    if (!this.parquetWriter) {
      throw new Error('Parquet writer not initialized')
    }
    await this.parquetWriter.close()
  }
}

export default ParquetFileWriter
