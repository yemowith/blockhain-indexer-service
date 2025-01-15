import { measureExecutionTime } from '../helpers/helpers'

const Task = async (taskName: string, args: any, taskFunction: Function) => {
  logger.info(`Starting task: ${taskName}`)
  try {
    const result = await measureExecutionTime(taskName, async () => {
      let result = await taskFunction(args) // Execute the provided task logic
      logger.info('Task result:', result)
      return result
    })
    logger.info(`Task "${taskName}" completed successfully.`)
    return result
  } catch (error) {
    logger.error(`Error in task "${taskName}":`, error)
    throw error
  }
}

export default Task
