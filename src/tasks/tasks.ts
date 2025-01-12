import resetAllClusters from './aws/resetAllClusters'
import createContainer from './container/createContainer'
import getContainer from './container/getContainer'
import resetAllContainers from './container/resetAllContainers'

const registeredTasks = [
  {
    name: 'create-container',
    task: createContainer,
  },
  {
    name: 'reset-all-containers',
    task: resetAllContainers,
  },
  {
    name: 'get-container',
    task: getContainer,
  },
  {
    name: 'reset-all-clusters',
    task: resetAllClusters,
  },
]

export default registeredTasks
