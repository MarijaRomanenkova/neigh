/*
  Warnings:

  - Made the column `color` on table `TaskAssignmentStatus` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "InvoiceItem_invoiceId_taskId_key";

-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "isSystemMessage" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "metadata" JSONB;

-- AlterTable
ALTER TABLE "TaskAssignmentStatus" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "color" SET NOT NULL,
ALTER COLUMN "color" SET DEFAULT '#808080',
ALTER COLUMN "order" SET DEFAULT 1,
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(6);
