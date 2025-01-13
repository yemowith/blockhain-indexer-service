import { ECSClient } from '@aws-sdk/client-ecs'

import { EC2Client } from '@aws-sdk/client-ec2'
import { SQSClient } from '@aws-sdk/client-sqs'

const ecsClient = new ECSClient({
  region: config.AWS.REGION,
  credentials: {
    accessKeyId: config.AWS.ACCESS_KEY_ID as string, // Replace with your access key ID
    secretAccessKey: config.AWS.SECRET_ACCESS_KEY as string, // Replace with your secret access key
  },
})

const ec2Client = new EC2Client({
  region: config.AWS.REGION,
  credentials: {
    accessKeyId: config.AWS.ACCESS_KEY_ID as string, // Replace with your access key ID
    secretAccessKey: config.AWS.SECRET_ACCESS_KEY as string, // Replace with your secret access key
  },
})

const sqsClient = new SQSClient({ region: config.AWS.REGION })

export { sqsClient, ecsClient, ec2Client }
