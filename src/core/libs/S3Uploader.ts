import {
  S3Client,
  PutObjectCommand,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
} from '@aws-sdk/client-s3'
import { createReadStream, statSync } from 'fs'
import { Readable } from 'stream'

interface UploadOptions {
  contentType?: string
  metadata?: Record<string, string>
  public?: boolean
}

class S3Uploader {
  private client: S3Client
  private bucket: string
  private readonly normalSize = 100 * 1024 * 1024 // 10 MB
  private readonly partSize = 50 * 1024 * 1024 // 5 MB

  constructor(client: S3Client, bucket: string) {
    this.client = client
    this.bucket = bucket
  }

  /**
   * Check if a file is considered "big"
   */
  private isBigFile(filePath: string): boolean {
    const fileSize = statSync(filePath).size
    return fileSize > this.normalSize
  }

  /**
   * Upload a file to S3, choosing the method based on file size
   */
  async uploadFile(
    key: string,
    filePath: string,
    options: UploadOptions = {},
  ): Promise<string> {
    if (this.isBigFile(filePath)) {
      return this.multipartUpload(key, filePath, options)
    } else {
      return this.normalUpload(key, filePath, options)
    }
  }

  /**
   * Normal upload for small files
   */
  private async normalUpload(
    key: string,
    filePath: string,
    options: UploadOptions,
  ): Promise<string> {
    const data = createReadStream(filePath)
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: data,
      ContentType: options.contentType,
      Metadata: options.metadata,
      ACL: options.public ? 'public-read' : undefined,
    })

    await this.client.send(command)
    logger.info(`Successfully uploaded file to S3: ${key}`)
    return key
  }

  /**
   * Multipart upload for large files
   */
  private async multipartUpload(
    key: string,
    filePath: string,
    options: UploadOptions,
  ): Promise<string> {
    const createMultipartUploadCommand = new CreateMultipartUploadCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: options.contentType,
      Metadata: options.metadata,
      ACL: options.public ? 'public-read' : undefined,
    })

    const createMultipartUploadResponse = await this.client.send(
      createMultipartUploadCommand,
    )
    const uploadId = createMultipartUploadResponse.UploadId

    const fileStream = createReadStream(filePath, {
      highWaterMark: this.partSize,
    })
    const parts = []
    let partNumber = 1

    for await (const chunk of fileStream) {
      const uploadPartCommand = new UploadPartCommand({
        Bucket: this.bucket,
        Key: key,
        PartNumber: partNumber,
        UploadId: uploadId,
        Body: chunk,
      })
      const uploadPartResponse = await this.client.send(uploadPartCommand)
      parts.push({ ETag: uploadPartResponse.ETag, PartNumber: partNumber })
      partNumber++
    }

    const completeMultipartUploadCommand = new CompleteMultipartUploadCommand({
      Bucket: this.bucket,
      Key: key,
      UploadId: uploadId,
      MultipartUpload: { Parts: parts },
    })

    await this.client.send(completeMultipartUploadCommand)
    logger.info(
      `Successfully uploaded file to S3 using multipart upload: ${key}`,
    )
    return key
  }
}

export default S3Uploader
