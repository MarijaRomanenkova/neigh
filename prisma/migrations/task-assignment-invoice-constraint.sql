-- Remove the old constraint
ALTER TABLE "InvoiceItem" DROP CONSTRAINT IF EXISTS "InvoiceItem_invoiceId_taskId_key";

-- Add an index on assignmentId to improve query performance when checking if a task assignment has been invoiced
CREATE INDEX IF NOT EXISTS "InvoiceItem_assignmentId_idx" ON "InvoiceItem"("assignmentId"); 
