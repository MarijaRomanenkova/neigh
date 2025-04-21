'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertCircle, Receipt } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface AddInvoiceDialogProps {
  taskId: string;
  clientId: string;
  taskAssignmentId: string;
  children: React.ReactNode;
}

export default function AddInvoiceDialog({ 
  taskId, 
  clientId, 
  taskAssignmentId, 
  children 
}: AddInvoiceDialogProps) {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();

  const handleProceed = () => {
    // Navigate to create invoice page with parameters including "Additional Service" flag
    router.push(
      `/user/dashboard/contractor/invoices/create?` +
      `clientId=${clientId}&` +
      `taskId=${taskId}&` +
      `taskAssignmentId=${taskAssignmentId}&` +
      `isAdditional=true`
    );
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            Issue Additional Invoice
          </DialogTitle>
          <DialogDescription>
            The original invoice for this task has already been issued and cannot be edited.
            Would you like to create an additional invoice for this task?
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-gray-600">
            Creating an additional invoice is appropriate for:
          </p>
          <ul className="list-disc list-inside text-sm text-gray-600 mt-2 space-y-1">
            <li>Additional services not covered in the original invoice</li>
            <li>Extra materials or expenses incurred</li>
            <li>Extended work beyond the original scope</li>
          </ul>
        </div>
        <DialogFooter className="sm:justify-end">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleProceed} className="gap-2">
            <Receipt className="h-4 w-4" />
            Proceed to Invoice
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 
