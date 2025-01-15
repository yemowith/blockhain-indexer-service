import { Batch, Operation } from '@prisma/client'
import dbClient from '../clients/db-prisma'
import { ArchiveOperation, Batch as BatchType } from '@/types/types'

const operation = {
  create: async (operation: ArchiveOperation): Promise<Operation> => {
    return await dbClient.operation.create({
      data: {
        totalBatches: operation.totalBatches,
        totalBatchesCompleted: operation.totalBatchesCompleted,
        totalBatchesFailed: operation.totalBatchesFailed,
        totalBatchesPending: operation.totalBatchesPending,
        startBlock: operation.startBlock,
        endBlock: operation.endBlock,
        lastBlock: operation.lastBlock,
        batchSize: operation.batchSize,
        lastProcessedBlock: operation.lastProcessedBlock,
        status: operation.status,
        batches: {},
      },
    })
  },
  get: async (id: string): Promise<Operation | null> => {
    try {
      return await dbClient.operation.findUnique({
        where: {
          id: id,
        },
      })
    } catch (error) {
      logger.error(`Error getting operation: ${error}`)
      throw error
    }
  },
  updateStatus: async (id: string, status: string): Promise<Operation> => {
    try {
      return await dbClient.operation.update({
        where: {
          id: id,
        },
        data: {
          status: status,
        },
      })
    } catch (error) {
      logger.error(`Error updating operation status: ${error}`)
      throw error
    }
  },
  updateLastProcessedBlock: async (
    id: string,
    lastProcessedBlock: number,
  ): Promise<Operation> => {
    return await dbClient.operation.update({
      where: { id },
      data: { lastProcessedBlock },
    })
  },
  update: async (
    id: string,
    {
      totalBatches,
      totalBatchesCompleted,
      totalBatchesFailed,
      totalBatchesPending,
    }: {
      totalBatches?: number
      totalBatchesCompleted?: number
      totalBatchesFailed?: number
      totalBatchesPending?: number
    },
  ): Promise<Operation> => {
    return await dbClient.operation.update({
      where: { id },
      data: {
        totalBatches,
        totalBatchesCompleted,
        totalBatchesFailed,
        totalBatchesPending,
      },
    })
  },
  deleteWithBatches: async (id: string): Promise<Operation> => {
    return await dbClient.operation.delete({
      where: { id },
    })
  },
  deleteAll: async (): Promise<any> => {
    try {
      await dbClient.batch.deleteMany()
      await dbClient.operation.deleteMany({})
    } catch (error) {
      logger.error(`Error deleting all operations and batches: ${error}`)
      throw error
    }
  },
}

const batch = {
  create: async (batch: BatchType): Promise<Batch> => {
    try {
      return await dbClient.batch.create({
        data: {
          startBlock: batch.startBlock,
          endBlock: batch.endBlock,
          status: batch.status,
          operationId: batch.operationId,
          count: batch.count,
        },
      })
    } catch (error) {
      logger.error(`Error creating batch: ${error}`)
      throw error
    }
  },
  createMany: async (batches: BatchType[]): Promise<Batch[]> => {
    try {
      const result = await dbClient.batch.createManyAndReturn({
        data: batches.map((batch) => ({
          startBlock: batch.startBlock,
          endBlock: batch.endBlock,
          status: batch.status,
          operationId: batch.operationId,
          count: batch.count,
        })),
      })
      return result
    } catch (error) {
      logger.error(`Error creating batches: ${error}`)
      throw error
    }
  },
  get: async (id: string): Promise<Batch | null> => {
    return await dbClient.batch.findUnique({
      where: {
        id: id,
      },
    })
  },
  updateStatus: async (id: string, status: string): Promise<Batch> => {
    try {
      return await dbClient.batch.update({
        where: {
          id: id,
        },
        data: {
          status: status,
        },
      })
    } catch (error) {
      logger.error(`Error updating batch status: ${error}`)
      throw error
    }
  },
  getFirstPending: async (): Promise<Batch | null> => {
    return await dbClient.batch.findFirst({
      where: {
        status: 'pending',
      },
      orderBy: {
        startBlock: 'asc',
      },
    })
  },
}

const dbPrismaProvider = { operation, batch }

export default dbPrismaProvider
