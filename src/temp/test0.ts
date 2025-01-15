import { bootstrap } from '../core/bootstrap'
import crypto from 'crypto'

import MNemonic from '../old/core/libs/MNemonic'
import Container from '../old/core/libs/Container'
import Wallet from '../old/core/libs/Wallet'
// Initialize globals
import fs from 'fs'
import parquetjs, { ParquetWriter } from '@dsnp/parquetjs'
import path from 'path'
import s3Provider from '../core/providers/s3Provider'

bootstrap()

// Hash hesaplama fonksiyonu
function computeHash(walletAddress: string, depth: number = 2) {
  const hash = crypto.createHash('md5').update(walletAddress).digest('hex')
  const parts: string[] = []
  for (let i = 0; i < depth; i++) {
    parts.push(hash.slice(i * 3, (i + 1) * 3)) // 3'er karakterlik gruplar
  }
  return parts.join('/')
}

const schema = parquetjs.ParquetSchema.fromJsonSchema({
  type: 'object',
  properties: {
    address: {
      type: 'UTF8',
    },
    permutation: {
      type: 'INT32',
    },
    containerId: {
      type: 'UTF8',
    },
  },
  required: ['address', 'permutation', 'containerId'],
})

;(async () => {
  const createBucket = async () => {
    try {
      await s3Provider.createBucket({
        name: 'wallets',
      })
    } catch (error) {
      //  console.error('Error creating bucket:', error)
    }
  }

  const uploadFile = async (localFilePath: string, s3Key: string) => {
    await s3Provider.upload(
      s3Key.replace(/^\//, ''),
      s3Key.replace(/^\//, ''),
      {
        contentType: 'application/octet-stream',
      },
      'wallets-data',
    )
  }

  const uploadFiles = async () => {
    try {
      const outputPath = path.join(__dirname, 'output')

      async function uploadFilesInDirectory(dirPath: string) {
        const entries = fs.readdirSync(dirPath, { withFileTypes: true })

        for (const entry of entries) {
          const fullPath = path.join(dirPath, entry.name)

          if (entry.isDirectory()) {
            await uploadFilesInDirectory(fullPath)
          } else if (entry.isFile()) {
            const relativePath = path.relative(outputPath, fullPath)
            const s3Key = `hashed-wallets/${relativePath}`
            try {
              await uploadFile(fullPath, s3Key)
              console.log(`Successfully uploaded ${s3Key}`)
            } catch (err) {
              console.error(`Failed to upload ${s3Key}:`, err)
              // Continue with next file even if one fails
            }

            // Add small delay between uploads
            await new Promise((resolve) => setTimeout(resolve, 1000))
          }
        }
      }

      await uploadFilesInDirectory(outputPath)
      console.log('Successfully uploaded output directory to S3')
    } catch (error) {
      console.error('Error uploading to S3:', error)
    }
  }

  const makeWallets = async () => {
    console.log('makeWallets')
    for (let i = 0; i < 10; i++) {
      /*

          const mnemonic = MNemonic.randomGenerator()
    let container = Container.containerInstance(mnemonic)
    let permutations = container.permutations()
    
      let permutation = container.getPermutationByIndex(i)
      let wallet = Wallet.walletInstance(permutation)
      let address = wallet.eth().address()

      // let hash = computeHash(address)

      let row = {
        address: address,
        permutation: i,
        containerId: '',
        hash: {
          path: '1',
          index: 1,
        },
      }
      */

      console.log('s')
    }
    return
  }

  await makeWallets()

  //await createBucket()

  // await uploadFiles()

  // await makeWallets()
  /*
  await uploadFile(
    path.join(__dirname, 'output', 'data.parquet'),
    'hashed-wallets/data.parquet',
  )
  */
})()
