import batchRunTask from '@/tasks/batchRun'
import archiveTask from '../tasks/archiveTask'
import scanBlockTask from '../tasks/blocks/scanBlock'

const registeredTasks: any[] = [
  {
    name: 'basic-task',
    task: scanBlockTask,
  },
  {
    name: 'archive-task',
    task: archiveTask,
  },
  {
    name: 'run-batch',
    task: batchRunTask,
  },
]

export default registeredTasks
