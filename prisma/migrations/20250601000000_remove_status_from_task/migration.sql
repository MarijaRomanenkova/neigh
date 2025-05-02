-- Drop the foreign key constraint first
ALTER TABLE "Task" DROP CONSTRAINT IF EXISTS "Task_statusId_fkey";

-- Drop the index on statusId
DROP INDEX IF EXISTS "Task_statusId_idx";

-- Remove the statusId column from Task table
-- We're doing this as the last step to make sure we don't lose any data
ALTER TABLE "Task" DROP COLUMN IF EXISTS "statusId";

-- Note: The TaskAssignmentStatus table remains as it's still used by TaskAssignment 
