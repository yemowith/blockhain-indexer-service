class ByteConverter {
  private static readonly BYTES_IN_KB = 1024
  private static readonly BYTES_IN_MB = 1024 * 1024
  private static readonly BYTES_IN_GB = 1024 * 1024 * 1024
  private static readonly BYTES_IN_TB = 1024 * 1024 * 1024 * 1024

  static toBytes(
    size: number,
    unit: 'B' | 'KB' | 'MB' | 'GB' | 'TB' = 'B',
  ): number {
    switch (unit.toUpperCase()) {
      case 'B':
        return size
      case 'KB':
        return size * this.BYTES_IN_KB
      case 'MB':
        return size * this.BYTES_IN_MB
      case 'GB':
        return size * this.BYTES_IN_GB
      case 'TB':
        return size * this.BYTES_IN_TB
      default:
        throw new Error('Invalid unit')
    }
  }

  static fromBytes(
    bytes: number,
  ): {
    size: number
    unit: string
  } {
    if (bytes >= this.BYTES_IN_TB) {
      return { size: bytes / this.BYTES_IN_TB, unit: 'TB' }
    }
    if (bytes >= this.BYTES_IN_GB) {
      return { size: bytes / this.BYTES_IN_GB, unit: 'GB' }
    }
    if (bytes >= this.BYTES_IN_MB) {
      return { size: bytes / this.BYTES_IN_MB, unit: 'MB' }
    }
    if (bytes >= this.BYTES_IN_KB) {
      return { size: bytes / this.BYTES_IN_KB, unit: 'KB' }
    }
    return { size: bytes, unit: 'B' }
  }
}

export default ByteConverter
