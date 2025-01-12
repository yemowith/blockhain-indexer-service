import {
  AWS_REGION,
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY,
  AWS_ACCOUNT_ID,
} from '../config'
import {
  CreateClusterCommand,
  DeleteClusterCommand,
  DescribeTaskDefinitionCommand,
  ECSClient,
  ListClustersCommand,
  ListContainerInstancesCommand,
  ListTaskDefinitionsCommand,
  ListTasksCommand,
  RegisterTaskDefinitionCommand,
  RunTaskCommand,
  StopTaskCommand,
  NetworkMode,
  TransportProtocol,
  LogDriver,
  Compatibility,
  DeregisterTaskDefinitionCommand,
} from '@aws-sdk/client-ecs'
import {
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  EC2Client,
} from '@aws-sdk/client-ec2'
import { ecsClient, ec2Client } from '../core/clients/aws'
import { logger } from '../core/helpers/helpers'
const VPC_ID: any = null

const getClusters = async () => {
  try {
    const command = new ListClustersCommand({})
    const response = await ecsClient.send(command)
    return response
  } catch (error) {
    console.error('Invalid credentials or insufficient permissions:', error)
  }
}

const listTaskDefinitions = async () => {
  try {
    const command = new ListTaskDefinitionsCommand({})
    const response = await ecsClient.send(command)
    return response
  } catch (error) {
    console.error('Error listing task definitions:', error)
  }
}

const listContainerInstances = async (clusterName: string) => {
  try {
    const command = new ListContainerInstancesCommand({ cluster: clusterName })
    const response = await ecsClient.send(command)
    return response
  } catch (error) {
    console.error('Error listing container instances:', error)
  }
}

const getClusterName = async () => {
  try {
    // List clusters
    const response = await getClusters()
    if (response?.clusterArns && response.clusterArns.length > 0) {
      // Extract the cluster name from the first ARN
      const clusterArn = response.clusterArns[0]
      const clusterName = clusterArn.split('/').pop() // Get the last part of the ARN

      logger('Cluster Name:', clusterName)
      return clusterName
    } else {
      logger('No clusters found.')
      return null
    }
  } catch (error) {
    console.error('Error listing clusters:', error)
    return null
  }
}

const getTaskDefinition = async () => {
  const taskDefinitions = await listTaskDefinitions()
  if (
    taskDefinitions?.taskDefinitionArns &&
    taskDefinitions.taskDefinitionArns.length > 0
  ) {
    return taskDefinitions.taskDefinitionArns[0]
  }
  return null
}

const getSubnets = async () => {
  try {
    const command = new DescribeSubnetsCommand({
      Filters: VPC_ID ? [{ Name: 'vpc-id', Values: [VPC_ID] }] : [], // Optional filter by VPC
    })

    const response = await ec2Client.send(command)

    if (response.Subnets && response.Subnets.length > 0) {
      const subnetIds = response.Subnets.map((subnet) => subnet.SubnetId)
      return subnetIds
    } else {
      logger('No subnets found.')
      return []
    }
  } catch (error) {
    console.error('Error retrieving subnets:', error)
    return []
  }
}

const getSecurityGroups = async () => {
  const command = new DescribeSecurityGroupsCommand({})
  const response = await ec2Client.send(command)

  if (response.SecurityGroups && response.SecurityGroups.length > 0) {
    const securityGroupIds = response.SecurityGroups.map((sg) => sg.GroupId)
    return securityGroupIds
  } else {
    logger('No security groups found.')
    return []
  }
}

const getContainerNameFromTaskDefinition = async (taskDefinition: string) => {
  try {
    const command = new DescribeTaskDefinitionCommand({ taskDefinition })
    const response = await ecsClient.send(command)

    if (response.taskDefinition?.containerDefinitions?.length) {
      const containerName = response.taskDefinition.containerDefinitions[0].name // Get the first container name
      logger('Container Name:', containerName)
      return containerName
    } else {
      console.error('No containers found in the task definition.')
      return null
    }
  } catch (error) {
    console.error('Error describing task definition:', error)
    return null
  }
}

const runNewTask = async (
  environment: { name: string; value: string }[],
  clusterName: string,
  taskDefinition: string,
) => {
  let containerName = await getContainerNameFromTaskDefinition(taskDefinition)
  if (!containerName) {
    console.error('Failed to get container name from task definition')
    return
  }

  let subnets = await getSubnets()

  if (!subnets || subnets.length === 0) {
    console.error('Failed to get subnets')
    return
  }

  let securityGroups = await getSecurityGroups()

  if (!securityGroups || securityGroups.length === 0) {
    console.error('Failed to get security groups')
    return
  }

  const params = {
    cluster: clusterName, // ECS cluster name
    taskDefinition: taskDefinition, // Task definition ARN or family:revision
    count: 10, // Number of tasks to run
    launchType: 'FARGATE', // Or "EC2" if using EC2 instances
    networkConfiguration: {
      awsvpcConfiguration: {
        subnets: subnets, // Replace with your VPC subnet ID(s)
        securityGroups: securityGroups, // Replace with your security group ID(s)
        assignPublicIp: 'ENABLED', // Assign a public IP to the task
      },
    },
    overrides: {
      containerOverrides: [
        {
          name: containerName, // Replace with container name from task definition
          environment: environment,
        },
      ],
    },
  }

  try {
    // @ts-ignore
    const command = new RunTaskCommand(params)
    const response = await ecsClient.send(command)
    logger('Task started successfully:', response.tasks)
    return response
  } catch (error) {
    console.error('Error running task:', error)
  }
}

const listClusterTasks = async (clusterName: string) => {
  try {
    const command = new ListTasksCommand({
      cluster: clusterName,
    })

    const response = await ecsClient.send(command)
    return response.taskArns || []
  } catch (error) {
    console.error('Error listing tasks:', error)
    return []
  }
}

const stopTask = async (clusterName: string, taskArn: string) => {
  try {
    const command = new StopTaskCommand({
      cluster: clusterName,
      task: taskArn, // Durdurulacak task ARN'si
      reason: 'Task manually stopped', // Durdurma sebebini belirtin (opsiyonel)
    })

    const response = await ecsClient.send(command)
    logger('Task stopped successfully:', response.task?.taskArn)
  } catch (error) {
    console.error('Error stopping task:', error)
  }
}

// Tüm Task'ları Durdur
const stopAllTasks = async (clusterName: string) => {
  const taskArns = await listClusterTasks(clusterName)

  if (taskArns.length === 0) {
    logger('No tasks found in the cluster.')
    return
  }

  logger('Stopping tasks:', taskArns)

  for (const taskArn of taskArns) {
    await stopTask(clusterName, taskArn)
  }

  logger('All tasks stopped.')
}

const createCluster = async (
  clusterName: string,
  tags: { key: string; value: string }[] = [],
) => {
  try {
    const params = {
      clusterName: clusterName, // Optional: Name of your cluster
      DefaultCapacityProviderStrategy: [
        {
          capacityProvider: 'FARGATE',
          base: 1,
          weight: 1,
        },
      ], // Optional: Define Fargate or EC2 strategies
      tags: tags,
    }

    const command = new CreateClusterCommand(params)
    const response = await ecsClient.send(command)

    logger('Cluster created successfully:', response.cluster?.clusterArn)
    return response.cluster
  } catch (error) {
    console.error('Error creating cluster:', error)
    throw error
  }
}

const deleteCluster = async (clusterName: string) => {
  try {
    // Stop all running tasks
    logger(`Stopping all tasks in cluster: ${clusterName}`)
    await stopAllTasks(clusterName)

    // Delete the cluster
    logger(`Deleting cluster: ${clusterName}`)
    const command = new DeleteClusterCommand({
      cluster: clusterName,
    })

    const response = await ecsClient.send(command)
    logger('Cluster deleted successfully:', response.cluster?.clusterArn)

    return response.cluster
  } catch (error) {
    console.error(`Error deleting cluster "${clusterName}":`, error)
    throw error
  }
}

const deleteAllClusters = async () => {
  let clusters = await getClusters()
  if (clusters && clusters.clusterArns) {
    for (const clusterArn of clusters.clusterArns) {
      const clusterName = clusterArn.split('/').pop()
      if (clusterName) {
        await deleteCluster(clusterName)
      }
    }
  }
}

const createTaskDefinition = async (
  family: string,
  container: string,
  image: string,
  environment?: { name: string; value: string }[],
) => {
  const awsRegion = AWS_REGION || 'default-region'
  const executionRoleArn = `arn:aws:iam::${AWS_ACCOUNT_ID}:role/ecsTaskExecutionRole` // Replace with your execution role ARN
  const params = {
    family: family, // Name of your task family
    networkMode: NetworkMode.AWSVPC, // Network mode: 'bridge', 'host', 'awsvpc', or 'none'
    requiresCompatibilities: [Compatibility.FARGATE], // Launch type compatibility
    executionRoleArn: executionRoleArn,
    cpu: '1024', // Task-level CPU (e.g., 256, 512, 1024 for Fargate)
    memory: '2048', // Task-level memory (e.g., 512, 1024 for Fargate)
    containerDefinitions: [
      {
        name: container, // Name of the container
        image: image, // Docker image to use
        cpu: 1, // Container-specific CPU allocation
        memory: 512, // Container-specific memory allocation
        portMappings: [
          {
            containerPort: 3000, // Port inside the container
            hostPort: 3000, // Port on the host
            protocol: TransportProtocol.TCP, // Protocol (tcp or udp)
          },
          {
            containerPort: 80, // Port inside the container
            hostPort: 80, // Port on the host
            protocol: TransportProtocol.TCP, // Protocol (tcp or udp)
          },
        ],
        environment: environment,
        logConfiguration: {
          logDriver: LogDriver.AWSLOGS, // Use the AWS CloudWatch Logs driver
          options: {
            'awslogs-group': `/ecs/wallet-container-service`,
            'awslogs-region': awsRegion,
            'awslogs-stream-prefix': 'ecs',
          },
        },
      },
    ],
  }
  try {
    // Ensure awslogs-region is a string

    const command = new RegisterTaskDefinitionCommand(params)
    const response = await ecsClient.send(command)

    logger(
      'Task Definition created successfully:',
      response.taskDefinition?.taskDefinitionArn,
    )
    return response.taskDefinition
  } catch (error) {
    console.error('Error creating Task Definition:', error)
    throw error
  }
}

const deleteTaskDefinition = async (taskDefinitionArn: string) => {
  try {
    const command = new DeregisterTaskDefinitionCommand({
      taskDefinition: taskDefinitionArn, // The ARN of the task definition to deregister
    })

    const response = await ecsClient.send(command)

    logger(
      'Task Definition deregistered successfully:',
      response.taskDefinition?.taskDefinitionArn,
    )
    return response.taskDefinition
  } catch (error) {
    console.error('Error deregistering Task Definition:', error)
    throw error
  }
}

const awsProvider = {
  getClusters,
  listTaskDefinitions,
  listContainerInstances,
  getTaskDefinition,
  runNewTask,
  getSubnets,
  getSecurityGroups,
  getContainerNameFromTaskDefinition,
  getClusterName,
  listClusterTasks,
  stopAllTasks,
  stopTask,
  createCluster,
  deleteCluster,
  deleteAllClusters,
  createTaskDefinition,
  deleteTaskDefinition,
}

export default awsProvider
