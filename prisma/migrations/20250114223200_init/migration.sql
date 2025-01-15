-- CreateTable
CREATE TABLE "Operation" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "totalBatches" INTEGER NOT NULL,
    "totalBatchesCompleted" INTEGER NOT NULL,
    "totalBatchesFailed" INTEGER NOT NULL,
    "totalBatchesPending" INTEGER NOT NULL,
    "startBlock" INTEGER NOT NULL,
    "endBlock" INTEGER NOT NULL,
    "lastBlock" INTEGER NOT NULL,
    "batchSize" INTEGER NOT NULL,
    "lastProcessedBlock" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Operation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Batch" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "operationId" UUID NOT NULL,
    "startBlock" INTEGER NOT NULL,
    "endBlock" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Batch_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Batch" ADD CONSTRAINT "Batch_operationId_fkey" FOREIGN KEY ("operationId") REFERENCES "Operation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
