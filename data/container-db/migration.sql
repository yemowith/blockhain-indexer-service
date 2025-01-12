-- Enable UUID generation in PostgreSQL
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- CreateTable
CREATE TABLE "WalletETH" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "address" TEXT NOT NULL,
    "containerId" TEXT NOT NULL,
    "permutation" INTEGER NOT NULL,
    "driver" TEXT,

    CONSTRAINT "WalletETH_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WalletBTC" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "address" TEXT NOT NULL,
    "containerId" TEXT NOT NULL,
    "permutation" INTEGER NOT NULL,
    "driver" TEXT,

    CONSTRAINT "WalletBTC_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WalletTRX" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "address" TEXT NOT NULL,
    "containerId" TEXT NOT NULL,
    "permutation" INTEGER NOT NULL,
    "driver" TEXT,

    CONSTRAINT "WalletTRX_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WalletETH_address_key" ON "WalletETH"("address");

-- CreateIndex
CREATE UNIQUE INDEX "WalletBTC_address_key" ON "WalletBTC"("address");

-- CreateIndex
CREATE UNIQUE INDEX "WalletTRX_address_key" ON "WalletTRX"("address");
