import CsvWriter from '@/core/libs/CsvWriter'

class CVSFileWriter {
  private filePath: string
  private csvWriter: CsvWriter | null = null

  constructor(filePath: string) {
    this.filePath = filePath
  }

  async init() {
    this.csvWriter = new CsvWriter({
      path: this.filePath,
      header: [
        'tType',
        'tFrom',
        'tTo',
        'tValue',
        'tTokenAdrs',
        'blckNum',
        'txHash',
      ],
      alwaysQuote: true,
      append: true,
      encoding: 'utf8',
      sendHeader: true,
    })
    await this.csvWriter.writeRecords([])
  }

  async writeHeader() {}

  async writeRecords(records: any[]) {
    if (!this.csvWriter) {
      throw new Error('CSV writer not initialized')
    }
    await this.csvWriter.writeRecords(records)
  }

  async close() {
    if (!this.csvWriter) {
      throw new Error('CSV writer not initialized')
    }
    await this.csvWriter.close()
  }
}

export default CVSFileWriter
