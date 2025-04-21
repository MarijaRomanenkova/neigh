# Invoice Constraint Migration

This migration removes the unique constraint `[invoiceId, taskId]` from the `InvoiceItem` table to support future functionality for corrective invoices and credit notes. This change allows:

1. The same task assignment to be invoiced multiple times (e.g., for corrections or replacements)
2. Issuing credit invoices for incorrect invoices that have already been paid
3. Implementing proper audit trails in the invoicing system

## Running the Migration

### Development Environment

To apply this migration to your development database, run:

```bash
npx prisma db execute --file ./prisma/migrations/task-assignment-invoice-constraint.sql --schema ./prisma/schema.prisma
npx prisma generate
```

### Production Environment

For production, make sure to backup your database first:

```bash
# Example for PostgreSQL
pg_dump -U youruser -d yourdatabase > backup_before_migration.sql
```

Then apply the migration:

```bash
npx prisma db execute --file ./prisma/migrations/task-assignment-invoice-constraint.sql --schema ./prisma/schema.prisma
npx prisma generate
```

## Verifying the Migration

After running the migration, you can verify that the constraint has been removed by checking the constraints on the `InvoiceItem` table:

```sql
SELECT con.conname, pg_get_constraintdef(con.oid)
FROM pg_catalog.pg_constraint con
INNER JOIN pg_catalog.pg_class rel ON rel.oid = con.conrelid
INNER JOIN pg_catalog.pg_namespace nsp ON nsp.oid = rel.relnamespace
WHERE rel.relname = 'InvoiceItem' AND con.contype = 'u';
```

You should NOT see the `InvoiceItem_invoiceId_taskId_key` constraint in the results. 
