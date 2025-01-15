-- AlterTable
ALTER TABLE "Batch" ALTER COLUMN "status" SET DEFAULT 'pending';

-- AlterTable
ALTER TABLE "Operation" ALTER COLUMN "totalBatches" SET DEFAULT 0,
ALTER COLUMN "totalBatchesCompleted" SET DEFAULT 0,
ALTER COLUMN "totalBatchesFailed" SET DEFAULT 0,
ALTER COLUMN "totalBatchesPending" SET DEFAULT 0,
ALTER COLUMN "startBlock" SET DEFAULT 0,
ALTER COLUMN "endBlock" SET DEFAULT 0,
ALTER COLUMN "lastBlock" SET DEFAULT 0,
ALTER COLUMN "status" SET DEFAULT 'pending';
