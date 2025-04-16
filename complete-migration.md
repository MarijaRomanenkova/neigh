# TaskStatus to TaskAssignmentStatus Migration Guide

After examining the current codebase and the requirements for renaming `TaskStatus` to `TaskAssignmentStatus`, we've determined that the best approach is to proceed in the following way:

## Steps to Complete the Migration

1. **Update the Prisma Schema**
   - We have already updated `prisma/schema.prisma` to rename the `TaskStatus` model to `TaskAssignmentStatus`

2. **Generate a New Prisma Client**
   ```bash
   npx prisma generate
   ```
   - This will update the generated client with the new model names

3. **Database Migration**
   - For development environments:
     ```bash
     npx prisma migrate dev --name rename_task_status_to_task_assignment_status
     ```
   - For production environments, we'll need a careful planned migration to avoid downtime:
     ```bash
     npx prisma migrate deploy
     ```

4. **Update Code References**
   - Manually update references from `taskStatus` to `taskAssignmentStatus` in:
     - `lib/actions/task-assignment.actions.ts`
     - Any component file that imports from task-status.actions.ts

5. **Rename Files**
   - Rename `lib/actions/task-status.actions.ts` to `lib/actions/task-assignment-status.actions.ts`
   - Update imports in files that use these actions

## Common Issues and Solutions

- **Prisma Client Type Errors**: After schema changes, TypeScript might report errors about missing properties like `taskAssignmentStatus` on the Prisma client. These will be resolved after running `npx prisma generate`.

- **Runtime Errors**: After updating, test your application thoroughly to ensure all features that rely on task statuses still work correctly.

## Testing the Changes

After completing the migration, test the following functionality:

1. Creating new task assignments
2. Updating task assignment statuses 
3. Viewing task assignments with different statuses
4. Any admin functionality for managing statuses

## Rollback Plan

If issues arise, have a rollback plan ready:

1. Revert schema changes
2. Run `npx prisma generate` to revert client changes
3. Update code references back to original names
4. Restore original file names

## Long-term Benefits

This rename improves the clarity of the code by:
1. Better reflecting that statuses apply to task assignments, not just tasks
2. Making the domain model more intuitive
3. Improving code maintainability 
