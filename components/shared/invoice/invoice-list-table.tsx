'use client';

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Invoice } from "@/types";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { Edit, Trash, CheckCircle, Clock, CreditCard, FileText, CheckSquare, Square, ArrowRight, Loader } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Card, CardContent } from "@/components/ui/card";

type InvoiceListTableProps = {
  invoices: Invoice[];
  userType: 'client' | 'contractor';
  onEdit?: (invoice: Invoice) => void;
  onDelete?: (invoice: Invoice) => void;
};

// Helper function to truncate text
const truncateText = (text: string, maxLength: number) => {
  if (!text) return '';
  return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
};

// Helper function to format date as DD-MM-YYYY
const formatDateAsDDMMYYYY = (date: Date): string => {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Months are 0-indexed
  const year = date.getFullYear();
  
  return `${day}-${month}-${year}`;
};

const InvoiceListTable = ({ 
  invoices, 
  userType, 
  onEdit,
  onDelete 
}: InvoiceListTableProps) => {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  
  // State to track selected invoices
  const [selectedInvoices, setSelectedInvoices] = useState<Invoice[]>([]);
  
  // Calculate total price of selected invoices
  const totalPrice = selectedInvoices.reduce((sum, invoice) => sum + Number(invoice.totalPrice), 0);

  // Handle checkbox toggle
  const toggleInvoiceSelection = (invoice: Invoice) => {
    if (invoice.isPaid) return; // Don't allow selecting paid invoices
    
    setSelectedInvoices(prev => {
      const isSelected = prev.some(item => item.id === invoice.id);
      
      if (isSelected) {
        // Remove from selection
        return prev.filter(item => item.id !== invoice.id);
      } else {
        // Add to selection
        return [...prev, invoice];
      }
    });
  };

  // Handle proceed to payment
  const handleProceedToPayment = () => {
    if (selectedInvoices.length === 0) {
      toast({
        variant: 'destructive',
        description: 'Please select at least one invoice to pay',
      });
      return;
    }

    startTransition(async () => {
      // Store selected invoice IDs in session storage for payment page
      sessionStorage.setItem('selectedInvoices', JSON.stringify(selectedInvoices.map(inv => inv.id)));
      router.push('/payment');
    });
  };

  return (
    <div className="flex flex-col md:flex-row gap-6">
      <div className="md:w-3/4">
        <TooltipProvider>
          <Table>
            <TableHeader>
              <TableRow>
                {userType === 'client' && <TableHead>Select</TableHead>}
                <TableHead>Invoice #</TableHead>
                <TableHead>{userType === 'client' ? 'Contractor' : 'Client'}</TableHead>
                <TableHead>Task</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Status</TableHead>
                <TableHead className="text-right">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => {
                // Convert to number here for calculations only, preserving the original invoice object
                const amount = Number(invoice.totalPrice);
                // Get task name from the first invoice item
                const taskName = invoice.items && invoice.items.length > 0 
                  ? invoice.items[0].name 
                  : 'N/A';
                
                const isSelected = selectedInvoices.some(item => item.id === invoice.id);
                
                return (
                  <TableRow key={invoice.id}>
                    {userType === 'client' && (
                      <TableCell>
                        {!invoice.isPaid && (
                          <button
                            onClick={() => toggleInvoiceSelection(invoice)}
                            className="focus:outline-none"
                            disabled={invoice.isPaid}
                          >
                            {isSelected ? (
                              <CheckSquare className="h-5 w-5 text-green-500" />
                            ) : (
                              <Square className="h-5 w-5 text-gray-400" />
                            )}
                          </button>
                        )}
                      </TableCell>
                    )}
                    <TableCell>{invoice.invoiceNumber}</TableCell>
                    <TableCell>
                      {userType === 'client' 
                        ? invoice.contractor.name 
                        : invoice.client.name}
                    </TableCell>
                    <TableCell>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="cursor-default">
                            {truncateText(taskName, 12)}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{taskName}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      {formatDateAsDDMMYYYY(new Date(invoice.createdAt))}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(amount)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end">
                        <Badge 
                          className={invoice.isPaid ? "bg-green-500" : "bg-yellow-500"}
                        >
                          {invoice.isPaid ? (
                            <div className="flex items-center">
                              <CheckCircle className="mr-1 h-3 w-3" />
                              <span>Paid</span>
                            </div>
                          ) : (
                            <div className="flex items-center">
                              <Clock className="mr-1 h-3 w-3" />
                              <span>Awaiting Payment</span>
                            </div>
                          )}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        size="sm" 
                        variant="secondary"
                        asChild
                      >
                        <Link href={`/user/dashboard/${userType}/invoices/${invoice.invoiceNumber}`}>
                          <FileText className="h-4 w-4 mr-1" />
                          View
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TooltipProvider>
      </div>

      {userType === 'client' && (
        <div className="md:w-1/4">
          <Card className="sticky top-4">
            <CardContent className="p-4 gap-4">
              <h3 className="text-lg font-semibold mb-4">Payment Summary</h3>
              {selectedInvoices.length === 0 ? (
                <p className="text-sm text-gray-500 mb-4">No invoices selected</p>
              ) : (
                <>
                  <div className="space-y-2 mb-4">
                    {selectedInvoices.map(invoice => (
                      <div key={invoice.id} className="flex justify-between text-sm">
                        <span>Invoice #{invoice.invoiceNumber}</span>
                        <span>{formatCurrency(Number(invoice.totalPrice))}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t pt-3 mb-4">
                    <div className="flex justify-between font-bold">
                      <span>Total Amount:</span>
                      <span>{formatCurrency(totalPrice)}</span>
                    </div>
                  </div>
                </>
              )}
              <Button
                className="w-full"
                disabled={isPending || selectedInvoices.length === 0}
                onClick={handleProceedToPayment}
              >
                {isPending ? (
                  <Loader className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <ArrowRight className="w-4 h-4 mr-2" />
                )}
                Proceed to Payment
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default InvoiceListTable; 
