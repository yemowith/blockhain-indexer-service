import { BatchBase } from '@/types/types'

function createBatches<T extends BatchBase>(
  total: number,
  processSize: number,
  currentStart: number = 1,
  data: Record<string, any>,
  dataFactory: (
    startBlock: number,
    endBlock: number,
    count: number,
    data: Record<string, any>,
  ) => Omit<T, 'startBlock' | 'endBlock' | 'id'>,
): T[] {
  const batches: T[] = []

  let id = 1 // ID için sayaç
  while (currentStart <= total) {
    const endNo = Math.min(currentStart + processSize - 1, total)
    const count = endNo - currentStart + 1
    batches.push({
      id: id, // Her süreç için benzersiz bir ID ekliyoruz
      startBlock: currentStart,
      endBlock: endNo,

      ...dataFactory(currentStart, endNo, count, data),
    } as T)
    currentStart = endNo + 1
    id++ // ID'yi bir sonraki süreç için artırıyoruz
  }

  return batches
}

// Process sayısını hesaplayan fonksiyon
function calculateBatchCount(total: number, batchSize: number): number {
  return Math.ceil(total / batchSize) // Toplam batch sayısını yukarı yuvarlar
}

export { createBatches, calculateBatchCount }
