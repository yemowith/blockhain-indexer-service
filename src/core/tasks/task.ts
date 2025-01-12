import { logger, measureExecutionTime } from '../helpers/helpers'

const task = async (taskName: string, args: any, taskFunction: Function) => {
  logger(`Starting task: ${taskName}`)
  try {
    const result = await measureExecutionTime(taskName, async () => {
      let result = await taskFunction(args) // Execute the provided task logic
      logger('Task result:', result)
      return result
    })
    logger(`Task "${taskName}" completed successfully.`)
    return result
  } catch (error) {
    console.error(`Error in task "${taskName}":`, error)
    throw error
  }
}

export default task
