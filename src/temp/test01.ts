import { bootstrap } from '../core/bootstrap'
import MNemonic from '../old/core/libs/MNemonic'
import Container from '../old/core/libs/Container'
import Wallet from '../old/core/libs/Wallet'

import path from 'path'
import s3Provider from '../core/providers/s3Provider'
import { ContainerInstanceType } from '../types/types'

var parquet = require('@dsnp/parquetjs')

const schema = parquet.ParquetSchema.fromJsonSchema({
  type: 'struct',
  properties: {
    i: {
      type: 'string',
    },
    a: {
      type: 'string',
    },
    p: {
      type: 'string',
    },
    c: {
      type: 'string',
    },
  },
  required: ['i', 'a', 'p', 'c'],
})

bootstrap()
;(async () => {
  const containers = async () => {
    for (let i = 0; i < 2; i++) {
      let container = Container.containerInstance(MNemonic.randomGenerator())
      console.log('container', i)
      await makeWallets(container, i.toString())
    }
  }

  const makeWallets = async (
    container: ContainerInstanceType,
    containerId: string,
  ) => {
    try {
      let folder = 'wltt'
      // let permutations = container.permutations()
      const writer = await parquet.ParquetWriter.openFile(
        schema,
        path.join(__dirname, folder, `wallet-${containerId}.parquet`),
        {},
      )
      for (let i = 0; i < 100; i++) {
        let permutation = container.getPermutationByIndex(i)
        let wallet = Wallet.walletInstance(permutation)
        let address = wallet.eth().address()
        // let hash = computeHash(address)

        let row = {
          i: i.toString(),
          a: 'yemen',
          p: i.toString(),
          c: containerId,
        }

        await writer.appendRow(row)
      }

      await writer.close()

      await new Promise((resolve) => setTimeout(resolve, 1000))

      await uploadFile(
        path.join(__dirname, folder, `wallet-${containerId}.parquet`),
        `${folder}/wallet-${containerId}.parquet`,
      )
    } catch (er) {
      console.log(er)
    }

    return
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

  const readW = async () => {
    // create new ParquetReader that reads from 'fruits.parquet`
    let reader = await parquet.ParquetReader.openFile(
      path.join(__dirname, 'output', 'wallets.parquet'),
    )

    // create a new cursor
    let cursor = reader.getCursor()

    // read all records from the file and print them
    let record = null
    while ((record = await cursor.next())) {
      console.log(record)
    }
  }

  await containers()
})()
