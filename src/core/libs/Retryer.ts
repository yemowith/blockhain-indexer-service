export default function retryWithDelay<T>(
  operation: () => Promise<T>,
  retries: number,
  delay: number,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const attempt = (remainingRetries: number) => {
      operation()
        .then(resolve)
        .catch((error) => {
          if (remainingRetries > 0) {
            setTimeout(() => {
              attempt(remainingRetries - 1)
            }, delay)
          } else {
            reject(error)
          }
        })
    }

    attempt(retries)
  })
}
