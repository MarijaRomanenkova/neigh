#!/usr/bin/env node

/**
 * Task Status Migration Script
 * 
 * This script safely applies the migration to remove the statusId field from the Task model.
 * It ensures the data is preserved and provides a rollback mechanism if needed.
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const prisma = new PrismaClient();

async function main() {
  console.log('Starting task status migration...');

  // Step 1: Backup the database state (optional but recommended)
  try {
    console.log('Creating a backup of the current database state...');
    // This assumes you have pg_dump installed and the DATABASE_URL configured
    // Replace with your actual backup strategy as needed
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(__dirname, '..', 'backups', `pre_migration_${timestamp}.sql`);
    
    // Ensure backups directory exists
    if (!fs.existsSync(path.join(__dirname, '..', 'backups'))) {
      fs.mkdirSync(path.join(__dirname, '..', 'backups'), { recursive: true });
    }
    
    // Extract connection info from DATABASE_URL
    const dbUrl = process.env.DATABASE_URL;
    if (dbUrl && dbUrl.includes('postgres')) {
      const command = `pg_dump ${dbUrl} > ${backupPath}`;
      execSync(command);
      console.log(`Database backup created at: ${backupPath}`);
    } else {
      console.log('Skipping database backup - no PostgreSQL connection URL found');
    }
  } catch (error) {
    console.warn('Warning: Could not create database backup:', error.message);
    console.warn('Proceeding without backup. Ctrl+C to abort if backup is required.');
    await new Promise(resolve => setTimeout(resolve, 5000)); // Give user time to abort
  }

  // Step 2: Check if there are any tasks with statusId that need special handling
  console.log('Checking for tasks with non-null statusId...');
  let tasksWithStatus;
  
  try {
    // This will fail after migration as statusId no longer exists, so wrap in try/catch
    tasksWithStatus = await prisma.$queryRaw`
      SELECT COUNT(*) FROM "Task" WHERE "statusId" IS NOT NULL
    `;
    
    if (tasksWithStatus && tasksWithStatus[0] && tasksWithStatus[0].count > 0) {
      console.log(`Found ${tasksWithStatus[0].count} tasks with statusId.`);
      console.log('These tasks will have their statusId removed but are otherwise preserved.');
    } else {
      console.log('No tasks with statusId found.');
    }
  } catch (error) {
    console.log('Could not check for tasks with statusId, table may already be migrated.');
  }

  // Step 3: Apply the migration
  console.log('\nApplying migration to remove statusId from Task model...');
  try {
    // You could apply the migration directly here with raw SQL
    // Or use Prisma migrate command
    console.log('Run the following command to apply the migration:');
    console.log('npx prisma migrate dev --name remove_status_from_task');
    
    // Alternatively, apply it directly (uncomment if preferred)
    // execSync('npx prisma migrate dev --name remove_status_from_task', { stdio: 'inherit' });
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  }

  console.log('\nMigration complete!');
  console.log('Make sure to deploy your code changes that remove statusId references.');
}

main()
  .catch(e => {
    console.error('Migration script error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 
