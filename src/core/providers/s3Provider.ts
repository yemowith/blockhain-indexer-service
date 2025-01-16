import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  HeadObjectCommand,
  CreateBucketCommand,
  DeleteBucketCommand,
  ListBucketsCommand,
  HeadBucketCommand,
  S3ClientConfig,
  _Object,
  BucketLocationConstraint,
  CreateBucketCommandInput,
  BucketCannedACL,
  PutBucketTaggingCommand,
  PutBucketVersioningCommand,
  GetBucketLocationCommand,
} from '@aws-sdk/client-s3'

import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { Readable } from 'stream'
import { config } from '@/config/config'

interface S3Config {
  region: string
  bucket: string
  accessKeyId?: string
  secretAccessKey?: string
  endpoint?: string
  forcePathStyle?: boolean
}

interface UploadOptions {
  contentType?: string
  metadata?: Record<string, string>
  expires?: number // in seconds
  public?: boolean
}

interface PresignedUrlOptions {
  expires?: number // in seconds
  contentType?: string
}

// Add new interfaces for bucket operations
interface BucketConfig {
  name: string
  region?: string
  acl?: string
  tags?: Record<string, string>
  versioning?: boolean
}

interface BucketInfo {
  name: string
  creationDate?: Date
  region?: string
}

interface S3Object {
  key: string
  size: number
  lastModified?: Date
  metadata?: Record<string, string>
  contentType?: string
}

class S3Provider {
  private client: S3Client
  private bucket: string

  constructor(config: S3Config) {
    const clientConfig: S3ClientConfig = {
      region: config.region,
      credentials:
        config.accessKeyId && config.secretAccessKey
          ? {
              accessKeyId: config.accessKeyId,
              secretAccessKey: config.secretAccessKey,
            }
          : undefined,
    }

    // Add endpoint for custom S3-compatible services
    if (config.endpoint) {
      clientConfig.endpoint = config.endpoint
      clientConfig.forcePathStyle = config.forcePathStyle ?? true
    }

    this.client = new S3Client(clientConfig)
    this.bucket = config.bucket
  }

  /**
   * Upload data to S3
   */
  async upload(
    key: string,
    data: Buffer | Readable | string,
    options: UploadOptions = {},
    bucketName: string = this.bucket,
  ): Promise<string> {
    try {
      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: data,
        ContentType: options.contentType,
        Metadata: options.metadata,
        ACL: options.public ? 'public-read' : undefined,
      })

      await this.client.send(command)
      logger.info(`Successfully uploaded file to S3: ${key}`)

      return key
    } catch (error) {
      logger.error(`Failed to upload file to S3: ${key}`, error)
      throw error
    }
  }

  /**
   * Download data from S3
   */
  async download(key: string): Promise<Buffer> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      })

      const response = await this.client.send(command)
      if (!response.Body) {
        throw new Error(`Empty response body for key: ${key}`)
      }

      // Convert stream to buffer
      const chunks: Buffer[] = []
      for await (const chunk of response.Body as Readable) {
        chunks.push(Buffer.from(chunk))
      }

      return Buffer.concat(chunks)
    } catch (error) {
      logger.error(`Failed to download file from S3: ${key}`, error)
      throw error
    }
  }

  /**
   * Generate a presigned URL for uploading
   */
  async getPresignedUploadUrl(
    key: string,
    options: PresignedUrlOptions = {},
  ): Promise<string> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        ContentType: options.contentType,
      })

      const url = await getSignedUrl(this.client, command, {
        expiresIn: options.expires || 3600,
      })

      return url
    } catch (error) {
      logger.error(`Failed to generate presigned upload URL: ${key}`, error)
      throw error
    }
  }

  /**
   * Generate a presigned URL for downloading
   */
  async getPresignedDownloadUrl(
    key: string,
    options: PresignedUrlOptions = {},
  ): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      })

      const url = await getSignedUrl(this.client, command, {
        expiresIn: options.expires || 3600,
      })

      return url
    } catch (error) {
      logger.error(`Failed to generate presigned download URL: ${key}`, error)
      throw error
    }
  }

  /**
   * Delete an object from S3
   */
  async delete(key: string, bucketName: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      })

      await this.client.send(command)
      logger.info(`Successfully deleted file from S3: ${key}`)
    } catch (error) {
      logger.error(`Failed to delete file from S3: ${key}`, error)
      throw error
    }
  }

  async deleteFolder(prefix: string = '') {
    const objects = await this.list(prefix)
    for (const obj of objects) {
      await this.delete(obj.key, this.bucket)
    }
  }

  /**
   * List objects in a directory
   */
  async list(prefix: string = '', maxKeys: number = 1000): Promise<S3Object[]> {
    try {
      const command = new ListObjectsV2Command({
        Bucket: this.bucket,
        Prefix: prefix,
        MaxKeys: maxKeys,
      })

      const response = await this.client.send(command)
      return (response.Contents || []).map(this.mapS3Object)
    } catch (error) {
      logger.error(`Failed to list objects with prefix: ${prefix}`, error)
      throw error
    }
  }

  /**
   * Check if an object exists
   */
  async exists(key: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key,
      })

      await this.client.send(command)
      return true
    } catch (error) {
      if ((error as any).name === 'NotFound') {
        return false
      }
      throw error
    }
  }

  /**
   * Get object metadata
   */
  async getMetadata(key: string): Promise<S3Object | null> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key,
      })

      const response = await this.client.send(command)
      return {
        key,
        size: response.ContentLength || 0,
        lastModified: response.LastModified,
        metadata: response.Metadata,
        contentType: response.ContentType,
      }
    } catch (error) {
      if ((error as any).name === 'NotFound') {
        return null
      }
      logger.error(`Failed to get metadata for: ${key}`, error)
      throw error
    }
  }

  /**
   * Stream data from S3
   */
  async createReadStream(key: string): Promise<Readable> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      })

      const response = await this.client.send(command)
      if (!response.Body) {
        throw new Error(`Empty response body for key: ${key}`)
      }

      return response.Body as Readable
    } catch (error) {
      logger.error(`Failed to create read stream for: ${key}`, error)
      throw error
    }
  }

  /**
   * Map S3 object to internal format
   */
  private mapS3Object(obj: _Object): S3Object {
    return {
      key: obj.Key || '',
      size: obj.Size || 0,
      lastModified: obj.LastModified,
    }
  }

  /**
   * Get bucket name
   */
  getBucket(): string {
    return this.bucket
  }

  /**
   * Get S3 client
   */
  getClient(): S3Client {
    return this.client
  }

  /**
   * Create a new bucket
   */
  async createBucket(config: BucketConfig): Promise<BucketInfo> {
    try {
      // Check if bucket already exists
      if (await this.bucketExists(config.name)) {
        throw new Error(`Bucket ${config.name} already exists`)
      }

      // Prepare bucket creation command input
      const input: CreateBucketCommandInput = {
        Bucket: config.name,
        ACL: config.acl as BucketCannedACL,
      }

      // Add location constraint if region is specified
      if (config.region && config.region !== 'us-east-1') {
        input.CreateBucketConfiguration = {
          LocationConstraint: config.region as BucketLocationConstraint,
        }
      }

      // Create bucket
      const command = new CreateBucketCommand(input)
      await this.client.send(command)

      // Add tags if specified
      if (config.tags && Object.keys(config.tags).length > 0) {
        await this.addBucketTags(config.name, config.tags)
      }

      // Enable versioning if specified
      if (config.versioning) {
        await this.enableBucketVersioning(config.name)
      }

      logger.info(`Successfully created bucket: ${config.name}`)

      // Get bucket info
      return {
        name: config.name,
        region: config.region || 'us-east-1',
        creationDate: new Date(),
      }
    } catch (error) {
      logger.error(`Failed to create bucket: ${config.name}`, error)
      throw error
    }
  }

  /**
   * Delete a bucket
   */
  async deleteBucket(
    bucketName: string,
    force: boolean = false,
  ): Promise<void> {
    try {
      // Check if bucket exists
      if (!(await this.bucketExists(bucketName))) {
        throw new Error(`Bucket ${bucketName} does not exist`)
      }

      // If force is true, delete all objects in the bucket first
      if (force) {
        await this.emptyBucket(bucketName)
      }

      const command = new DeleteBucketCommand({
        Bucket: bucketName,
      })

      await this.client.send(command)
      logger.info(`Successfully deleted bucket: ${bucketName}`)
    } catch (error) {
      logger.error(`Failed to delete bucket: ${bucketName}`, error)
      throw error
    }
  }

  /**
   * Check if a bucket exists
   */
  async bucketExists(bucketName: string): Promise<boolean> {
    try {
      const command = new HeadBucketCommand({
        Bucket: bucketName,
      })

      await this.client.send(command)
      return true
    } catch (error) {
      if ((error as any).name === 'NotFound') {
        return false
      }
      throw error
    }
  }

  /**
   * List all buckets
   */
  async listBuckets(): Promise<BucketInfo[]> {
    try {
      const command = new ListBucketsCommand({})
      const response = await this.client.send(command)

      return (response.Buckets || []).map((bucket) => ({
        name: bucket.Name || '',
        creationDate: bucket.CreationDate,
      }))
    } catch (error) {
      logger.error('Failed to list buckets', error)
      throw error
    }
  }

  /**
   * Empty a bucket (delete all objects)
   */
  private async emptyBucket(bucketName: string): Promise<void> {
    try {
      let continuationToken: string | undefined

      do {
        const command = new ListObjectsV2Command({
          Bucket: bucketName,
          ContinuationToken: continuationToken,
        })

        const response = await this.client.send(command)

        if (response.Contents && response.Contents.length > 0) {
          await Promise.all(
            response.Contents.map((obj) =>
              this.delete(obj.Key || '', bucketName),
            ),
          )
        }

        continuationToken = response.NextContinuationToken
      } while (continuationToken)

      logger.info(`Successfully emptied bucket: ${bucketName}`)
    } catch (error) {
      logger.error(`Failed to empty bucket: ${bucketName}`, error)
      throw error
    }
  }

  /**
   * Add tags to a bucket
   */
  private async addBucketTags(
    bucketName: string,
    tags: Record<string, string>,
  ): Promise<void> {
    try {
      const command = new PutBucketTaggingCommand({
        Bucket: bucketName,
        Tagging: {
          TagSet: Object.entries(tags).map(([Key, Value]) => ({
            Key,
            Value,
          })),
        },
      })

      await this.client.send(command)
      logger.info(`Successfully added tags to bucket: ${bucketName}`)
    } catch (error) {
      logger.error(`Failed to add tags to bucket: ${bucketName}`, error)
      throw error
    }
  }

  /**
   * Enable versioning on a bucket
   */
  private async enableBucketVersioning(bucketName: string): Promise<void> {
    try {
      const command = new PutBucketVersioningCommand({
        Bucket: bucketName,
        VersioningConfiguration: {
          Status: 'Enabled',
        },
      })

      await this.client.send(command)
      logger.info(`Successfully enabled versioning on bucket: ${bucketName}`)
    } catch (error) {
      logger.error(
        `Failed to enable versioning on bucket: ${bucketName}`,
        error,
      )
      throw error
    }
  }

  /**
   * Get bucket location (region)
   */
  async getBucketLocation(bucketName: string): Promise<string> {
    try {
      const command = new GetBucketLocationCommand({
        Bucket: bucketName,
      })

      const response = await this.client.send(command)
      return response.LocationConstraint || 'us-east-1'
    } catch (error) {
      logger.error(`Failed to get bucket location: ${bucketName}`, error)
      throw error
    }
  }
}

// Create singleton instance
const s3Provider = new S3Provider({
  region: config.AWS.REGION || 'eu-north-1',
  bucket: config.AWS.S3_BUCKET || '',
  accessKeyId: config.AWS.ACCESS_KEY_ID,
  secretAccessKey: config.AWS.SECRET_ACCESS_KEY,
  endpoint: config.AWS.S3_ENDPOINT,
  forcePathStyle: true,
})

export default s3Provider

// Export types
export type { S3Config, UploadOptions, PresignedUrlOptions, S3Object }
