const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function executeCommand(command) {
  console.log(`Executing: ${command}`);
  try {
    const output = execSync(command, { encoding: 'utf8' });
    console.log(output);
    return output;
  } catch (error) {
    console.error(`Error executing command: ${command}`);
    console.error(error.message);
    throw error;
  }
}

async function main() {
  // 1. Create a new Prisma migration
  console.log('Creating migration...');
  executeCommand('npx prisma migrate dev --name rename_task_status_to_task_assignment_status --create-only');
  
  // 2. Modify the migration SQL to rename the tables and constraints
  const migrationsDir = path.join(__dirname, 'prisma', 'migrations');
  const migrationDirs = fs.readdirSync(migrationsDir)
    .filter(dir => dir.includes('rename_task_status_to_task_assignment_status'))
    .map(dir => path.join(migrationsDir, dir))
    .sort((a, b) => fs.statSync(b).mtime.getTime() - fs.statSync(a).mtime.getTime());
  
  if (migrationDirs.length === 0) {
    throw new Error('Migration directory not found');
  }
  
  const latestMigrationDir = migrationDirs[0];
  const migrationSqlPath = path.join(latestMigrationDir, 'migration.sql');
  
  // Replace the generated SQL with our custom rename operations
  const migrationSql = `-- Rename TaskAssignmentStatus table to TaskAssignmentStatus
ALTER TABLE "TaskAssignmentStatus" RENAME TO "TaskAssignmentStatus";

-- Update unique constraint
ALTER INDEX "TaskAssignmentStatus_name_key" RENAME TO "TaskAssignmentStatus_name_key";

-- Update primary key constraint
ALTER INDEX IF EXISTS "TaskAssignmentStatus_pkey" RENAME TO "TaskAssignmentStatus_pkey";
`;
  
  console.log(`Writing custom migration SQL to ${migrationSqlPath}`);
  fs.writeFileSync(migrationSqlPath, migrationSql);
  
  // 3. Apply the migration
  console.log('Applying migration...');
  executeCommand('npx prisma migrate dev --name rename_task_status_to_task_assignment_status');
  
  // 4. Generate the updated Prisma client
  console.log('Generating Prisma client...');
  executeCommand('npx prisma generate');
  
  console.log('Migration complete. Now update your code to use TaskAssignmentStatus instead of TaskAssignmentStatus.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  }); 
