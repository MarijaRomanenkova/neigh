'use client';

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

type InvoiceDetailsProps = {
  invoice: Invoice;
};

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
            <p>{formatDateTime(invoice.createdAt).dateOnly}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Contact Information */}
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-sm font-semibold mb-2">From (Contractor)</p>
            <div className="text-sm">
              <p>Contractor ID: {invoice.contractorId}</p>
              {/* Add more contractor details as needed */}
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold mb-2">To (Client)</p>
            <div className="text-sm">
              <p>Client ID: {invoice.clientId}</p>
              {/* Add more client details as needed */}
            </div>
          </div>
        </div>

        {/* Invoice Items */}
        <div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoice.items.map((item) => {
                const itemPrice = Number(item.price);
                const itemTotal = itemPrice * (item.qty || 1);
                
                return (
                  <TableRow key={item.id}>
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
              Paid on: {formatDateTime(invoice.paidAt).dateTime}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default InvoiceDetails;
