'use client';

/**
 * @module InvoiceListTable
 * @description A comprehensive table component for displaying invoice lists with different views for clients and contractors.
 * The component includes functionality for selecting invoices, viewing details, and proceeding to payment.
 */

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Invoice } from "@/types";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { Edit, Trash, CheckCircle, Clock, CreditCard, FileText, CheckSquare, Square, ArrowRight, Loader, MessageSquare, ChevronLeft, ChevronRight, Eye, Link2 } from "lucide-react";
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
import { getTaskAssignmentByInvoiceNumber } from "@/lib/actions/task-assignment.actions";

/**
 * @interface InvoiceListTableProps
 * @property {Invoice[]} invoices - Array of invoice objects to display in the table
 * @property {'client' | 'contractor'} userType - The type of user viewing the table, determines available actions
 * @property {(invoice: Invoice) => void} [onEdit] - Optional callback function for editing an invoice
 * @property {(invoice: Invoice) => void} [onDelete] - Optional callback function for deleting an invoice
 */
type InvoiceListTableProps = {
  invoices: Invoice[];
  userType: 'client' | 'contractor';
  onEdit?: (invoice: Invoice) => void;
  onDelete?: (invoice: Invoice) => void;
};

/**
 * Helper function to truncate text to a specified length and add ellipsis if needed.
 * 
 * @param {string} text - The text to truncate
 * @param {number} maxLength - Maximum length before truncation
 * @returns {string} The truncated text with ellipsis if applicable
 */
const truncateText = (text: string, maxLength: number) => {
  if (!text) return '';
  return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
};

/**
 * Helper function to format a date object as DD-MM-YYYY string.
 * 
 * @param {Date} date - The date to format
 * @returns {string} Formatted date string in DD-MM-YYYY format
 */
const formatDateAsDDMMYYYY = (date: Date): string => {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Months are 0-indexed
  const year = date.getFullYear();
  
  return `${day}-${month}-${year}`;
};

/**
 * ContactButton Component
 * 
 * A button that handles navigation to the appropriate conversation
 * for a specific invoice and task. Uses the Conversations API to
 * find existing conversations or create new ones.
 * 
 * @param {Object} props - Component props
 * @param {string} props.taskId - ID of the task related to the invoice
 * @param {string} props.clientId - ID of the client
 * @param {string} props.contractorId - ID of the contractor
 * @param {'client'|'contractor'} props.userType - User role viewing the invoice
 * @returns {JSX.Element} A button that navigates to the conversation
 */
function ContactButton({ 
  taskId, 
  clientId, 
  contractorId, 
  userType 
}: { 
  taskId: string; 
  clientId: string; 
  contractorId: string; 
  userType: 'client' | 'contractor' 
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleContact = async () => {
    try {
      setIsLoading(true);
      
      // First, check if a conversation already exists for this task
      const response = await fetch(`/api/conversations?taskId=${taskId}`);
      
      if (!response.ok) {
        throw new Error('Failed to check for existing conversations');
      }
      
      const conversations = await response.json();
      
      if (conversations && conversations.length > 0) {
        // Conversation exists, navigate to it
        router.push(`/user/dashboard/messages/${conversations[0].id}`);
      } else {
        // No existing conversation, create a new one
        const createResponse = await fetch('/api/conversations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            taskId,
            participantIds: [userType === 'contractor' ? clientId : contractorId]
          }),
        });
        
        if (!createResponse.ok) {
          throw new Error('Failed to create conversation');
        }
        
        const newConversation = await createResponse.json();
        router.push(`/user/dashboard/messages/${newConversation.id}`);
      }
    } catch (error) {
      console.error('Error navigating to conversation:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to open conversation. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      size="sm"
      variant="secondary"
      onClick={handleContact}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader className="h-4 w-4 animate-spin" />
      ) : (
        <MessageSquare className="h-4 w-4" />
      )}
    </Button>
  );
}

/**
 * InvoiceListTable component for displaying and managing a list of invoices.
 * Provides different functionality based on user type (client or contractor).
 * For clients, it includes invoice selection for batch payment processing.
 * 
 * @param {Object} props - Component props
 * @param {Invoice[]} props.invoices - Array of invoice objects to display
 * @param {'client' | 'contractor'} props.userType - Type of user viewing the table
 * @param {(invoice: Invoice) => void} [props.onEdit] - Optional callback for editing
 * @param {(invoice: Invoice) => void} [props.onDelete] - Optional callback for deleting
 * @returns {JSX.Element} Table component with invoice list and payment summary for clients
 */
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
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const invoicesPerPage = 5; // Number of invoices per page
  
  // Calculate total price of selected invoices
  const totalPrice = selectedInvoices.reduce((sum, invoice) => sum + Number(invoice.totalPrice), 0);

  // Calculate pagination values
  const totalPages = Math.ceil(invoices.length / invoicesPerPage);
  const indexOfLastInvoice = currentPage * invoicesPerPage;
  const indexOfFirstInvoice = indexOfLastInvoice - invoicesPerPage;
  const currentInvoices = invoices.slice(indexOfFirstInvoice, indexOfLastInvoice);
  
  const handlePageChange = (pageNumber: number) => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  /**
   * Toggles selection state of an invoice for payment.
   * Prevents selection of already paid invoices.
   * 
   * @param {Invoice} invoice - The invoice to toggle selection for
   */
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

  /**
   * Handles proceeding to payment with selected invoices.
   * Stores selected invoice IDs in session storage and navigates to payment page.
   */
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
    <div className="flex flex-col gap-6 h-full">
      {/* Payment Summary - Now at the top */}
      {userType === 'client' && (
        <Card className="w-full">
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Payment Summary</h3>
              
              <div className="flex items-center gap-4">
                {selectedInvoices.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {selectedInvoices.length} invoice{selectedInvoices.length !== 1 ? 's' : ''} selected
                    </span>
                    <span className="text-lg font-bold">
                      {formatCurrency(totalPrice)}
                    </span>
                  </div>
                )}
                
                <Button
                  variant="success"
                  size="sm"
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
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    
      {/* Table with constrained height */}
      <div className="w-full overflow-hidden flex flex-col">
        <div className="overflow-auto" style={{ maxHeight: 'calc(100vh - 250px)' }}>
          <TooltipProvider>
            <Table>
              <TableHeader>
                <TableRow>
                  {userType === 'client' && <TableHead className="text-center">Select</TableHead>}
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>{userType === 'client' ? 'Contractor' : 'Client'}</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-center">View</TableHead>
                  <TableHead className="text-center">Assignment</TableHead>
                  <TableHead className="text-center">Contact</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentInvoices.map((invoice, index) => {
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
                        <TableCell className="text-center align-middle">
                          {!invoice.isPaid && (
                            <button
                              onClick={() => toggleInvoiceSelection(invoice)}
                              className="focus:outline-none inline-flex mt-1"
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
                      <TableCell className="font-medium">{(currentPage - 1) * invoicesPerPage + index + 1}</TableCell>
                      <TableCell>{invoice.invoiceNumber}</TableCell>
                      <TableCell>
                        {userType === 'client' 
                          ? invoice.contractor.name 
                          : invoice.client.name}
                      </TableCell>
                      <TableCell>
                        {formatDateAsDDMMYYYY(new Date(invoice.createdAt))}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(amount)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge 
                          variant={invoice.isPaid ? "paid" : "destructive"}
                        >
                          {invoice.isPaid ? (
                            <>
                              <CheckCircle className="mr-1 h-3 w-3" />
                              <span>Paid</span>
                            </>
                          ) : (
                            <>
                              <Clock className="mr-1 h-3 w-3" />
                              <span>Unpaid</span>
                            </>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button 
                          size="sm" 
                          variant="secondary"
                          asChild
                        >
                          <Link href={`/user/dashboard/${userType}/invoices/${invoice.invoiceNumber}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                      </TableCell>
                      <TableCell className="text-center">
                        {invoice.items && invoice.items.length > 0 && invoice.items[0]?.taskId && (
                          <Button 
                            size="sm" 
                            variant="secondary"
                            onClick={async () => {
                              try {
                                const result = await getTaskAssignmentByInvoiceNumber(invoice.invoiceNumber);
                                if (result.success && result.taskAssignmentId) {
                                  // Different route paths for client and contractor
                                  const taskPath = userType === 'contractor' ? 'assignments' : 'task-assignments';
                                  router.push(`/user/dashboard/task-assignments/${result.taskAssignmentId}`);
                                } else {
                                  toast({
                                    variant: 'destructive',
                                    title: 'Error',
                                    description: result.message || 'Failed to find the task assignment.'
                                  });
                                }
                              } catch (error) {
                                console.error('Error navigating to task assignment:', error);
                                toast({
                                  variant: 'destructive',
                                  title: 'Error',
                                  description: 'Failed to find the task assignment.'
                                });
                              }
                            }}
                          >
                            <Link2 className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {invoice.items && invoice.items.length > 0 && invoice.items[0]?.taskId && (
                          <ContactButton
                            taskId={invoice.items[0].taskId}
                            clientId={invoice.clientId}
                            contractorId={invoice.contractorId}
                            userType={userType}
                          />
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TooltipProvider>
        </div>
        
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 py-4 mt-4 border-t">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="text-sm">
              Page {currentPage} of {totalPages}
            </div>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvoiceListTable; 
