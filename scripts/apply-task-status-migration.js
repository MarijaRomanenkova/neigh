#!/usr/bin/env node

/**
 * @file Task Status Migration Script
 * @description Safely applies the migration to remove the statusId field from the Task model. Backs up the database, checks for affected records, and guides the user through migration steps.
 *
 * Usage: Run this script before applying the Prisma migration that removes the statusId field from the Task model.
 *
 * - Creates a backup of the database (PostgreSQL only)
 * - Checks for tasks with a non-null statusId
 * - Instructs the user to apply the migration
 *
 * @module scripts/apply-task-status-migration
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const prisma = new PrismaClient();

/**
 * Main migration workflow.
 *
 * 1. Creates a backup of the current database (if PostgreSQL and DATABASE_URL is set)
 * 2. Checks for tasks with a non-null statusId
 * 3. Instructs the user to apply the migration
 *
 * @async
 * @returns {Promise<void>} Resolves when migration steps are complete
 */
async function main() {
  console.log('Starting task status migration...');

  /**
   * Step 1: Backup the database state
   * 
   * Creates a backup of the current database state using pg_dump if DATABASE_URL is set for PostgreSQL.
   * The backup is stored in the backups directory with a timestamp.
   */
  try {
    console.log('Creating a backup of the current database state...');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(__dirname, '..', 'backups', `pre_migration_${timestamp}.sql`);

    if (!fs.existsSync(path.join(__dirname, '..', 'backups'))) {
      fs.mkdirSync(path.join(__dirname, '..', 'backups'), { recursive: true });
    }

    const dbUrl = process.env.DATABASE_URL;
    if (dbUrl && dbUrl.includes('postgres')) {
      const command = `pg_dump ${dbUrl} > ${backupPath}`;
      execSync(command);
      console.log(`Database backup created at: ${backupPath}`);
    } else {
      console.log('Skipping database backup: no PostgreSQL connection URL found.');
    }
  } catch (error) {
    console.warn('Warning: Could not create database backup:', error.message);
    console.warn('Proceeding without backup. Press Ctrl+C to abort if backup is required.');
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  /**
   * Step 2: Check for tasks with a non-null statusId
   * 
   * Queries the database to find tasks that have a non-null statusId.
   * This query will fail after migration, so it's wrapped in try/catch.
   */
  console.log('Checking for tasks with non-null statusId...');
  let tasksWithStatus;

  try {
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
    console.log('Could not check for tasks with statusId. The table may already be migrated.');
  }

  /**
   * Step 3: Instruct user to apply the migration
   * 
   * Provides the command for the user to apply the migration.
   * Optionally, the migration can be applied automatically by uncommenting the execSync line.
   */
  console.log('\nApply the migration to remove statusId from Task model:');
  try {
    console.log('Run the following command to apply the migration:');
    console.log('npx prisma migrate dev --name remove_status_from_task');
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  }

  console.log('\nMigration steps complete!');
  console.log('Remember to deploy your code changes that remove statusId references.');
}

main()
  .catch(e => {
    console.error('Migration script error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 
