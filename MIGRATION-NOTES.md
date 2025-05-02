# Task Status Migration

## Overview

This document explains the changes made to the database schema to remove the status field from the Task model. We've refactored the application to manage statuses exclusively through TaskAssignment entities, while Task entities now only have an `isArchived` boolean to indicate if they are active or archived.

## Changes Made

1. **Schema Changes**:
   - Removed `statusId` field from the `Task` model
   - Removed relation between `Task` and `TaskAssignmentStatus`
   - Kept `TaskAssignmentStatus` for use with `TaskAssignment`

2. **Code Changes**:
   - Updated `Task` interface in TypeScript to remove `statusId`
   - Modified `createTask` function to no longer assign a default "OPEN" status
   - Updated task mapping code in various places to remove references to `statusId`
   - Updated tests to reflect the new schema

3. **Database Migration**:
   - Created a migration that safely removes the `statusId` field from the `Task` table
   - Dropped foreign key constraint and index before removing the column

## Impact on Existing Data

This change is non-destructive to existing data. We've carefully designed the migration to:

1. First drop the foreign key constraint (`Task_statusId_fkey`)
2. Then drop the index on the column (`Task_statusId_idx`)
3. Finally drop the column itself (`statusId`)

All task statuses are now exclusively managed through task assignments, preserving the existing status workflow but with a cleaner data model.

## Reasoning

Tasks themselves are just advertisements or offerings. The actual work status (OPEN, IN_PROGRESS, COMPLETED, etc.) should be tracked at the assignment level, where a specific contractor is working on a specific task for a client. 

The `isArchived` boolean on Task is sufficient to indicate whether the task is still active in the marketplace or has been removed/archived.

## Testing

After deploying this change, please verify:

1. Tasks can still be created successfully
2. Task assignments continue to track status correctly
3. The UI properly handles the lack of status on Task entities
4. Task archiving/unarchiving works correctly

## Rollback Plan

If necessary, the change can be rolled back by:

1. Adding the `statusId` field back to the `Task` model
2. Re-establishing the relation to `TaskAssignmentStatus`
3. Reverting code changes that removed `statusId` handling 
