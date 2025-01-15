import CsvWriter from '@/core/libs/CsvWriter'
import ParquetFileWriter from './ParquetFileWriter'
import CVSFileWriter from './CVSFileWriter'

class FileWriter {
  private filePath: string
  private selectedWriter: ParquetFileWriter | CVSFileWriter | null = null
  public writer: 'cvs' | 'parquet' = 'parquet'

  constructor(filePath: string, writer: 'cvs' | 'parquet') {
    this.filePath = filePath
    this.writer = writer
  }

  async init() {
    if (this.writer === 'parquet') {
      this.selectedWriter = new ParquetFileWriter(this.filePath)
    } else if (this.writer === 'cvs') {
      this.selectedWriter = new CVSFileWriter(this.filePath)
    } else {
      throw new Error('Invalid writer')
    }
    await this.selectedWriter.init()
  }

  async writeHeader() {}

  async writeRecords(records: any[]) {
    if (!this.selectedWriter) {
      throw new Error('Writer not initialized')
    }
    await this.selectedWriter.writeRecords(records)
  }

  async close() {
    if (!this.selectedWriter) {
      throw new Error('Writer not initialized')
    }
    await this.selectedWriter.close()
  }
}

export default FileWriter
