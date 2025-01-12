type ProcessBase = {
  id: number // Benzersiz ID
  startNo: number
  endNo: number
}

function createProcesses<T extends ProcessBase>(
  total: number,
  processSize: number,
  data: Record<string, any>,
  dataFactory: (
    startNo: number,
    endNo: number,
    data: Record<string, any>,
  ) => Omit<T, 'startNo' | 'endNo' | 'id'>,
): T[] {
  const processes: T[] = []
  let currentStart = 1
  let id = 1 // ID için sayaç

  while (currentStart <= total) {
    const endNo = Math.min(currentStart + processSize - 1, total)
    processes.push({
      id, // Her süreç için benzersiz bir ID ekliyoruz
      startNo: currentStart,
      endNo: endNo,
      ...dataFactory(currentStart, endNo, data),
    } as T)
    currentStart = endNo + 1
    id++ // ID'yi bir sonraki süreç için artırıyoruz
  }

  return processes
}

// Process sayısını hesaplayan fonksiyon
function calculateProcessCount(total: number, processSize: number): number {
  return Math.ceil(total / processSize) // Toplam process sayısını yukarı yuvarlar
}

export { createProcesses, calculateProcessCount }
