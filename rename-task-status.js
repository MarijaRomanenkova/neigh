const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

function generateTimestamp() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  
  return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

async function main() {
  // Generate the SQL migration
  const timestamp = generateTimestamp();
  const migrationName = `${timestamp}_rename_task_status_to_task_assignment_status`;
  
  const migrationSql = `-- Rename TaskAssignmentStatus table to TaskAssignmentStatus
ALTER TABLE "TaskAssignmentStatus" RENAME TO "TaskAssignmentStatus";

-- Update unique constraint
ALTER INDEX "TaskAssignmentStatus_name_key" RENAME TO "TaskAssignmentStatus_name_key";

-- Update primary key constraint
ALTER INDEX IF EXISTS "TaskAssignmentStatus_pkey" RENAME TO "TaskAssignmentStatus_pkey";
`;

  // Create migrations directory if it doesn't exist
  const migrationsDir = path.join(__dirname, 'prisma', 'migrations', migrationName);
  if (!fs.existsSync(migrationsDir)) {
    fs.mkdirSync(migrationsDir, { recursive: true });
  }
  
  // Write migration SQL
  fs.writeFileSync(
    path.join(migrationsDir, 'migration.sql'),
    migrationSql
  );
  
  console.log(`Migration created at: ${migrationsDir}`);
  console.log('Migration complete. Now update your code to use TaskAssignmentStatus instead of TaskAssignmentStatus.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  }); 
