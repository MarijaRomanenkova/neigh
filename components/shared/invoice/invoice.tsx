'use client';

/**
 * Invoice Details Component
 * @module Components
 * @group Shared/Invoice
 * 
 * This client-side component renders a detailed view of an invoice,
 * including item breakdown, pricing, and payment status.
 */

import { Invoice } from '@/types';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

/**
 * Props for the InvoiceDetails component
 * @interface InvoiceDetailsProps
 * @property {Invoice} invoice - The invoice data to display
 */
type InvoiceDetailsProps = {
  invoice: Invoice;
};

/**
 * Invoice Details Component
 * 
 * Renders a comprehensive invoice view with:
 * - Invoice header with number and issue date
 * - Client and contractor information
 * - Itemized list of services/products with quantities and prices
 * - Total amount calculation
 * - Payment status and date information
 * 
 * Uses shadcn/ui Card and Table components for consistent styling.
 * 
 * @param {InvoiceDetailsProps} props - Component properties
 * @returns {JSX.Element} The rendered invoice details
 */
const InvoiceDetails = ({ invoice }: InvoiceDetailsProps) => {
  // Convert Decimal to number for calculations
  const total = Number(invoice.totalPrice);

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Invoice Number</p>
            <p className="text-xl font-semibold">{invoice.invoiceNumber}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Date Issued</p>
            <p>{formatDateTime(invoice.createdAt)}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Contact Information */}
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-sm font-semibold mb-2">From (Contractor)</p>
            <div className="text-sm">
              <p>{invoice.contractor.name}</p>
              <p>{invoice.contractor.email}</p>
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold mb-2">To (Client)</p>
            <div className="text-sm">
              <p>{invoice.client.name}</p>
              <p>{invoice.client.email}</p>
            </div>
          </div>
        </div>

        {/* Invoice Items */}
        <div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoice.items.map((item, index) => {
                const itemPrice = Number(item.price);
                const itemTotal = itemPrice * (item.qty || 1);
                
                return (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>{item.description}</TableCell>
                    <TableCell className="text-right">{item.qty}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(itemPrice)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(itemTotal)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Totals */}
        <div className="space-y-2">
          <div className="flex justify-between font-semibold">
            <p>Total</p>
            <p>{formatCurrency(total)}</p>
          </div>
        </div>

        {/* Payment Status */}
        <div className="pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            Payment Status: {invoice.isPaid ? 'Paid' : 'Pending'}
          </p>
          {invoice.paidAt && (
            <p className="text-sm text-muted-foreground">
              Paid on: {formatDateTime(invoice.paidAt)}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default InvoiceDetails;
