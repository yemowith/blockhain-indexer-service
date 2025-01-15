import cacheProvider, { CACHE_GROUPS } from '@/core/providers/cacheProvider'
import {
  ArchiveOperation,
  ArchiveOperationInfo,
  Batch,
  BlockScanInfo,
} from '@/types/types'

class OperationHelper {
  operationInfo: ArchiveOperationInfo | null = null
  constructor() {}
}

export default OperationHelper
