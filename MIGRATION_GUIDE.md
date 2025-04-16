# TaskStatus to TaskAssignmentStatus Migration Guide

## Overview

renamed the `TaskStatus` model to `TaskAssignmentStatus` to better reflect its actual purpose in the application. This model is primarily used to track the status of task assignments (relationships between tasks, clients, and contractors), not the tasks themselves.

## Migration Steps

1. Run the migration script to update the database schema:

```bash
node migrate-task-status.js
```

This script will:
- Create a new Prisma migration
- Customize the SQL to rename the table and constraints
- Apply the migration
- Generate an updated Prisma client

2. Rename the following files:
   - `lib/actions/task-status.actions.ts` → `lib/actions/task-assignment-status.actions.ts`

3. Update function names in imported files:
   - `getAllTaskStatuses` → `getAllTaskAssignmentStatuses`
   - `getTaskStatusByName` → `getTaskAssignmentStatusByName`

## Files to Update

Here's a list of files that likely need updating:

### Backend/Server Files

- [x] `prisma/schema.prisma` - Model renamed and references updated
- [x] `lib/actions/task-status.actions.ts` - Renamed and updated
- [x] `lib/actions/task-assignment.actions.ts` - Updated references

### Frontend/UI Files that may need updating

- [ ] Task assignment forms
- [ ] Status displays and filters
- [ ] Admin panels for status management
- [ ] Any component that imports from `task-status.actions.ts`

## Testing

After making these changes, thoroughly test:

1. Task assignment creation
2. Status updates for assignments
3. Filtering by status
4. Any admin functionality for managing statuses

## Rationale for Change

This rename improves the clarity of the code by:

1. Better reflecting the domain model - assignments go through status transitions
2. Making the code more self-explanatory
3. Aligning the model name with its actual usage in the application

Tasks themselves are simply active or archived, while assignments have various status stages (OPEN, IN_PROGRESS, COMPLETED, ACCEPTED). 
