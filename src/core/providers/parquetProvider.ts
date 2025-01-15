const parquetjs = require('parquetjs')

class ParquetProvider {
  private parquetjs: any
  constructor() {
    this.parquetjs = parquetjs
  }
}

export default ParquetProvider
