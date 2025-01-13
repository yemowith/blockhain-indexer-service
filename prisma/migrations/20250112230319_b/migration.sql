-- CreateEnum
CREATE TYPE "TransferType" AS ENUM ('ETH_TRANSFER', 'ERC20_TRANSFER', 'ERC20_APPROVAL', 'ERC721_TRANSFER', 'ERC1155_TRANSFER_SINGLE', 'ERC1155_TRANSFER_BATCH');

-- CreateEnum
CREATE TYPE "BlockStatus" AS ENUM ('PENDING', 'SCANNING', 'PROCESSED', 'FAILED');

-- CreateTable
CREATE TABLE "Contracts" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "address" VARCHAR(42) NOT NULL,
    "isERC20" BOOLEAN NOT NULL DEFAULT false,
    "isERC721" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tokens" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "address" VARCHAR(42) NOT NULL,
    "symbol" VARCHAR(10),
    "name" VARCHAR(100),
    "decimals" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transfers" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "type" "TransferType" DEFAULT 'ETH_TRANSFER',
    "tokenAddress" VARCHAR(42),
    "from" VARCHAR(42) NOT NULL,
    "to" VARCHAR(42) NOT NULL,
    "value" BIGINT NOT NULL,
    "blockNumber" INTEGER NOT NULL,
    "transactionHash" VARCHAR(66) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transfers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Blocks" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "blockNumber" INTEGER NOT NULL,
    "status" "BlockStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Blocks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Contracts_address_key" ON "Contracts"("address");

-- CreateIndex
CREATE INDEX "Contracts_address_idx" ON "Contracts"("address");

-- CreateIndex
CREATE INDEX "Tokens_address_idx" ON "Tokens"("address");

-- CreateIndex
CREATE UNIQUE INDEX "Tokens_address_key" ON "Tokens"("address");

-- CreateIndex
CREATE INDEX "Transfers_transactionHash_type_tokenAddress_idx" ON "Transfers"("transactionHash", "type", "tokenAddress");

-- CreateIndex
CREATE INDEX "Transfers_to_from_idx" ON "Transfers"("to", "from");

-- CreateIndex
CREATE INDEX "Transfers_tokenAddress_from_idx" ON "Transfers"("tokenAddress", "from");

-- CreateIndex
CREATE INDEX "Transfers_tokenAddress_to_idx" ON "Transfers"("tokenAddress", "to");

-- CreateIndex
CREATE UNIQUE INDEX "Transfers_transactionHash_type_tokenAddress_key" ON "Transfers"("transactionHash", "type", "tokenAddress");

-- CreateIndex
CREATE INDEX "Blocks_blockNumber_idx" ON "Blocks"("blockNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Blocks_blockNumber_key" ON "Blocks"("blockNumber");
