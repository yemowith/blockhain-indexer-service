import { ENABLE_LOGGING } from '../../config'

function toLowerCase(input: string): string {
  return input.toLowerCase()
}

function createObjectsForChunks(number: number, chunkSize: number) {
  const objects = []
  let remaining = number
  let id = 1
  let startWith = 1 // Starting value of the current chunk

  while (remaining > 0) {
    const chunk = Math.min(remaining, chunkSize) // Take a chunk of chunkSize or less if smaller
    const endsWith = startWith + chunk - 1 // Calculate the ending value of the chunk
    objects.push({ id, value: chunk, startWith, endsWith })
    remaining -= chunk
    startWith += chunk // Update startWith to the next starting point
    id++
  }

  return objects
}

function logger(message: string, data?: any) {
  if (ENABLE_LOGGING) {
    if (data) {
      console.log(message, data)
    } else {
      console.log(message)
    }
  }
}

async function measureExecutionTime<T>(
  label: string,
  func: () => Promise<T>,
): Promise<T> {
  const startTime = Date.now()
  console.log(`${label}: Starting process...`)

  const result = await func()

  const endTime = Date.now()
  console.log(
    `${label}: All tasks completed! Total time taken: ${
      endTime - startTime
    } ms`,
  )

  return result
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export {
  toLowerCase,
  createObjectsForChunks,
  logger,
  measureExecutionTime,
  sleep,
}
