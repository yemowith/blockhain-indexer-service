export default class TaskQueue {
  private maxWorkers: number
  private queue: (() => Promise<void>)[] = []
  private activeWorkers = 0
  private delayBetweenTasks: number

  constructor(maxWorkers: number, delayBetweenTasks: number = 0) {
    if (maxWorkers <= 0) {
      throw new Error('maxWorkers must be greater than 0')
    }
    this.maxWorkers = maxWorkers
    this.delayBetweenTasks = delayBetweenTasks
    console.log(
      `TaskQueue initialized with maxWorkers: ${maxWorkers}, delayBetweenTasks: ${delayBetweenTasks}ms`,
    )
  }

  // Add a task to the queue and wait for it to complete
  async add<T extends Record<string, any>>(
    taskName: (params: T) => Promise<void>,
    params: T,
  ): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      const wrappedTask = async () => {
        try {
          await taskName(params)

          resolve()
        } catch (error) {
          reject(error)
        } finally {
          this.activeWorkers--
          if (this.delayBetweenTasks > 0) {
            await new Promise((res) => setTimeout(res, this.delayBetweenTasks))
          }
          this.processNext()
        }
      }

      this.queue.push(wrappedTask)
      this.processNext()
    })
  }

  // Process the next task if available and within maxWorkers limit
  private processNext() {
    if (this.queue.length > 0 && this.activeWorkers < this.maxWorkers) {
      const nextTask = this.queue.shift()
      if (nextTask) {
        this.activeWorkers++
        nextTask()
      }
    }
  }

  // Wait until all tasks in the queue are completed
  async wait(): Promise<void> {
    console.log('Waiting for all tasks to complete...')
    return new Promise((resolve) => {
      const interval = setInterval(() => {
        if (this.queue.length === 0 && this.activeWorkers === 0) {
          clearInterval(interval)
          resolve()
        }
      }, 50) // Check every 50ms
    })
  }
}
