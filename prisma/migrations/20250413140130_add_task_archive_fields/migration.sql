-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "archivedAt" TIMESTAMP(6),
ADD COLUMN     "isArchived" BOOLEAN NOT NULL DEFAULT false;
