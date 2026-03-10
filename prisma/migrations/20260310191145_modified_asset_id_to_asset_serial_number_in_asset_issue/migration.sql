/*
  Warnings:

  - You are about to drop the column `assetId` on the `AssetIssue` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "AssetIssue" DROP CONSTRAINT "AssetIssue_assetId_fkey";

-- DropIndex
DROP INDEX "AssetIssue_assetId_idx";

-- AlterTable
ALTER TABLE "AssetIssue" DROP COLUMN "assetId",
ADD COLUMN     "assetSerialNumber" TEXT;

-- CreateIndex
CREATE INDEX "AssetIssue_assetSerialNumber_idx" ON "AssetIssue"("assetSerialNumber");

-- AddForeignKey
ALTER TABLE "AssetIssue" ADD CONSTRAINT "AssetIssue_assetSerialNumber_fkey" FOREIGN KEY ("assetSerialNumber") REFERENCES "Asset"("serialNumber") ON DELETE SET NULL ON UPDATE CASCADE;
