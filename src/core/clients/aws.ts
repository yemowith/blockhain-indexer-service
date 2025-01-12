import { ECSClient } from '@aws-sdk/client-ecs'
import {
  AWS_ACCESS_KEY_ID,
  AWS_REGION,
  AWS_SECRET_ACCESS_KEY,
  AWS_ACCOUNT_ID,
} from '../../config'
import { EC2Client } from '@aws-sdk/client-ec2'
import { SQSClient } from '@aws-sdk/client-sqs'

const ecsClient = new ECSClient({
  region: AWS_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID as string, // Replace with your access key ID
    secretAccessKey: AWS_SECRET_ACCESS_KEY as string, // Replace with your secret access key
  },
})

const ec2Client = new EC2Client({
  region: AWS_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID as string, // Replace with your access key ID
    secretAccessKey: AWS_SECRET_ACCESS_KEY as string, // Replace with your secret access key
  },
})

const sqsClient = new SQSClient({ region: AWS_REGION })

export { sqsClient, ecsClient, ec2Client }
