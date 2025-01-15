import { bootstrap } from './core/bootstrap'

import registeredTasks from './config/tasks'

bootstrap()

const runTask = async (taskName: string, args: any) => {
  const _task = registeredTasks.find((task) => task.name === taskName)
  if (_task) {
    logger.info('App starts with task ${taskName}')
    await _task.task(args)
  } else {
    logger.warn(`Task "${taskName}" is not registered.`)
  }
}

;(async () => {
  // Start server
  const taskName = process.argv[2]
  const args = process.argv.slice(3)

  if (!taskName) {
    logger.error('Task name is required')
    process.exit(1)
  }

  await runTask(taskName, args)
})()
