async function processWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  processor: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = []
  const inProgress = new Set<Promise<void>>()

  for (const item of items) {
    const promise = (async () => {
      const result = await processor(item)
      results.push(result)
    })()

    inProgress.add(promise)
    promise.then(() => inProgress.delete(promise))

    if (inProgress.size >= concurrency) {
      // Wait for at least one promise to complete
      await Promise.race(inProgress)
    }
  }

  // Wait for remaining promises
  await Promise.all(inProgress)
  return results
}

export default processWithConcurrency
