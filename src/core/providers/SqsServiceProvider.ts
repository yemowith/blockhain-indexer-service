import {
  CreateQueueCommand,
  DeleteQueueCommand,
  GetQueueUrlCommand,
  ListQueuesCommand,
  PurgeQueueCommand,
  QueueAttributeName,
  SendMessageBatchCommand,
  SendMessageCommand,
} from '@aws-sdk/client-sqs'
import { sqsClient } from '@/core/clients/aws'
import { config } from '../../config/config'

const createQueue = async (
  queueName: string,
  attributes: Partial<Record<QueueAttributeName, string>> = {},
) => {
  try {
    const command = new CreateQueueCommand({
      QueueName: queueName, // Kuyruk adı
      Attributes: attributes, // Opsiyonel: Kuyruk özellikleri
    })

    const response = await sqsClient.send(command)
    logger.info(`Queue created successfully: ${response.QueueUrl}`)
    return response.QueueUrl
  } catch (error) {
    console.error('Error creating queue:', error)
    throw error
  }
}

const sendMessageToQueue = async (
  queueName: string,
  message: string,
  messageGroupId: string = 'defaultGroupId',
) => {
  const queueUrl = getQueueUrl(queueName)
  let options: any = {
    QueueUrl: queueUrl,
    MessageBody: message,
  }

  if (queueName.includes('.fifo')) {
    options.MessageGroupId = messageGroupId
  }
  const command = new SendMessageCommand(options)
  const response = await sqsClient.send(command)
  return response
}

const getQueueUrl = (queueName: string) => {
  return `https://sqs.${config.AWS.REGION}.amazonaws.com/${config.AWS.ACCOUNT_ID}/${queueName}`
}

const checkIfQueueExists = async (queueName: string): Promise<boolean> => {
  try {
    const command = new GetQueueUrlCommand({ QueueName: queueName })
    const response = await sqsClient.send(command)
    logger.info(`Queue exists. Queue URL: ${response.QueueUrl}`)
    return true // Queue exists
  } catch (error) {
    return false
  }
}

const deleteQueues = async (queueUrls: string[]) => {
  try {
    // Step 1: Validate input
    if (!queueUrls || queueUrls.length === 0) {
      logger.info('No queue URLs provided.')
      return
    }

    logger.info('Deleting the following queues:', queueUrls)

    // Step 2: Delete queues in parallel
    await Promise.all(
      queueUrls.map(async (queueUrl) => {
        try {
          const deleteCommand = new DeleteQueueCommand({ QueueUrl: queueUrl })
          await sqsClient.send(deleteCommand)
          logger.info(`Deleted queue: ${queueUrl}`)
        } catch (error) {
          logger.error(`Error deleting queue ${queueUrl}:`, error)
        }
      }),
    )

    logger.info('All specified queues deleted.')
  } catch (error) {
    logger.error('Error deleting queues:', error)
  }
}

const deleteAllMessagesByQueueName = async (queueName: string) => {
  try {
    // Step 1: Get Queue URL by Name
    const getQueueUrlCommand = new GetQueueUrlCommand({ QueueName: queueName })
    const queueUrlResponse = await sqsClient.send(getQueueUrlCommand)
    const queueUrl = queueUrlResponse.QueueUrl

    logger.info(`Queue URL for "${queueName}": ${queueUrl}`)

    // Step 2: Purge the Queue
    const purgeQueueCommand = new PurgeQueueCommand({ QueueUrl: queueUrl })
    await sqsClient.send(purgeQueueCommand)

    logger.info(`All messages in the queue "${queueName}" have been deleted.`)
  } catch (error) {
    logger.error('Error deleting messages:', error)
  }
}

const sendBulkMessagesToQueue = async (
  queueName: string,
  messages: string[], // Array of message bodies
  messageGroupId: string = 'defaultGroupId', // FIFO-specific
) => {
  const queueUrl = await getQueueUrl(queueName) // Resolve queue URL
  const isFifoQueue = queueName.includes('.fifo')

  // Prepare message batch
  const entries = messages.map((message, index) => ({
    Id: `${index}`, // Unique ID for each message in the batch
    MessageBody: message,
    ...(isFifoQueue && { MessageGroupId: messageGroupId }), // Add MessageGroupId for FIFO queues
  }))

  // Chunk messages into batches of 10 (SQS limit)
  const chunks = []
  while (entries.length > 0) {
    chunks.push(entries.splice(0, 10)) // SQS allows a maximum of 10 messages per batch
  }

  const results = []

  // Send each batch
  for (const chunk of chunks) {
    const options = {
      QueueUrl: queueUrl,
      Entries: chunk,
    }

    const command = new SendMessageBatchCommand(options)
    try {
      const response = await sqsClient.send(command)

      results.push(response.Successful)
    } catch (error) {
      logger.error('Error sending batch:', error)
      throw error
    }
  }

  return results
}

const SqsServiceProvider = {
  createQueue,
  sendMessageToQueue,
  getQueueUrl,
  checkIfQueueExists,
  deleteQueues,
  deleteAllMessagesByQueueName,
  sendBulkMessagesToQueue,
}

export default SqsServiceProvider
