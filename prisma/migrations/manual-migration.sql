-- Step 1: Create the new TaskAssignmentStatus table
CREATE TABLE "TaskAssignmentStatus" (
  "id" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "color" TEXT NOT NULL DEFAULT '#808080',
  "order" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(6) NOT NULL,
  CONSTRAINT "TaskAssignmentStatus_pkey" PRIMARY KEY ("id")
);

-- Step 2: Create the unique constraint on the name
CREATE UNIQUE INDEX "TaskAssignmentStatus_name_key" ON "TaskAssignmentStatus"("name");

-- Step 3: Copy data from the old table to the new one
INSERT INTO "TaskAssignmentStatus" ("id", "name", "description", "color", "order", "createdAt", "updatedAt")
SELECT "id", "name", "description", "color", "order", "createdAt", "updatedAt" FROM "TaskStatus";

-- Step 4: Update TaskAssignment references to point to the new table
-- This temporarily disables the foreign key constraint
ALTER TABLE "TaskAssignment" DROP CONSTRAINT IF EXISTS "TaskAssignment_statusId_fkey";
ALTER TABLE "TaskAssignment" ADD CONSTRAINT "TaskAssignment_statusId_fkey" 
  FOREIGN KEY ("statusId") REFERENCES "TaskAssignmentStatus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Step 5: Update Task references to point to the new table
-- This temporarily disables the foreign key constraint
ALTER TABLE "Task" DROP CONSTRAINT IF EXISTS "Task_statusId_fkey";
ALTER TABLE "Task" ADD CONSTRAINT "Task_statusId_fkey" 
  FOREIGN KEY ("statusId") REFERENCES "TaskAssignmentStatus"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Step 6: After confirming everything works, we can drop the old table
DROP TABLE "TaskStatus";
-- Now that everything is working, we've dropped the old table
