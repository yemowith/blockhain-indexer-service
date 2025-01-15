import { promises as fs } from 'fs'
import { createWriteStream } from 'fs'

interface CsvWriterOptions {
  path: string
  header?: string[]
  alwaysQuote?: boolean
  append?: boolean
  encoding?: BufferEncoding
  sendHeader?: boolean
  bufferSize?: number // New option for controlling buffer size
}

class CsvWriter {
  private options: CsvWriterOptions
  private headerWritten: boolean = false
  private writeStream: fs.FileHandle | null = null
  private buffer: string[] = []
  private readonly BUFFER_SIZE: number

  constructor(options: CsvWriterOptions) {
    this.options = {
      alwaysQuote: false,
      append: false,
      encoding: 'utf8',
      sendHeader: true,
      bufferSize: 1000, // Default buffer size
      ...options,
    }
    this.BUFFER_SIZE = this.options.bufferSize || 1000
  }

  // Memoized quote regex
  private static readonly QUOTE_REGEX = /"/g

  private quoteValue(value: string | number | boolean): string {
    const stringValue = String(value)
    if (!this.options.alwaysQuote) return stringValue
    return `"${stringValue.replace(CsvWriter.QUOTE_REGEX, '""')}"`
  }

  private buildRow(data: Record<string, any>): string {
    const header = this.options.header
    if (!header) {
      return Object.values(data).map(this.quoteValue.bind(this)).join(',')
    }

    // Pre-allocate array for better performance
    const rowValues = new Array(header.length)
    for (let i = 0; i < header.length; i++) {
      rowValues[i] = this.quoteValue(data[header[i]] ?? '')
    }
    return rowValues.join(',')
  }

  public async writeHeader(): Promise<void> {
    if (
      !this.options.sendHeader ||
      this.headerWritten ||
      !this.options.header
    ) {
      return
    }

    const headerRow = this.options.header
      .map(this.quoteValue.bind(this))
      .join(',')
    await this.writeToFile(`${headerRow}\n`)
    this.headerWritten = true
  }

  public async writeRecords(data: Record<string, any>[]): Promise<void> {
    if (this.options.header && !this.headerWritten) {
      await this.writeHeader()
    }

    // Process records in chunks for better memory management
    const chunkSize = 1000
    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.slice(i, i + chunkSize)
      const rows = chunk.map((row) => this.buildRow(row)).join('\n')
      await this.writeToFile(`${rows}\n`)
    }
  }

  private async writeToFile(content: string): Promise<void> {
    const { path, append, encoding } = this.options

    try {
      if (!this.writeStream) {
        const flag = append ? 'a' : 'w'
        this.writeStream = await fs.open(path, flag)
      }

      await this.writeStream.writeFile(
        content,
        encoding ? { encoding } : undefined,
      )
    } catch (error) {
      if (this.writeStream) {
        await this.writeStream.close()
        this.writeStream = null
      }
      throw error
    }
  }

  public async close(): Promise<void> {
    if (this.writeStream) {
      await this.writeStream.close()
      this.writeStream = null
    }
  }
}

export default CsvWriter
