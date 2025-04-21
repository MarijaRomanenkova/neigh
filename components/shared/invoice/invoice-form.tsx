'use client';
/**
 * @module InvoiceForm
 * @description A form component for creating or updating invoices.
 * This component handles dynamic invoice item management, total price calculation,
 * and submission of the invoice data.
 */

import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertInvoiceSchema } from "@/lib/validators";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { Invoice, InvoiceItems } from "@/types";
import { useState, useEffect } from "react";
import { createInvoice } from "@/lib/actions/invoice.actions";
import { getUserById } from "@/lib/actions/user.actions";
import { getTaskAssignmentInvoiceHistory } from "@/lib/actions/task-assignment.actions";
import { useRouter } from "next/navigation";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import { Trash2, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

/**
 * @interface InvoiceFormProps
 * @property {'Create' | 'Update'} type - Determines whether the form is for creating or updating an invoice
 * @property {Invoice} [invoice] - Existing invoice data for updates
 * @property {Object} [prefillData] - Optional data to prefill the form
 * @property {string} [prefillData.taskId] - Task ID to prefill
 * @property {string} [prefillData.taskName] - Task name to prefill
 * @property {string|number} [prefillData.taskPrice] - Task price to prefill
 * @property {string} [prefillData.clientId] - Client ID to prefill
 * @property {string} [prefillData.clientName] - Client name to prefill
 * @property {string} [prefillData.contractorId] - Contractor ID to prefill
 * @property {string} [prefillData.taskAssignmentId] - Task assignment ID to prefill
 */
type InvoiceFormProps = {
  type: 'Create' | 'Update';
  invoice?: Invoice;
  prefillData?: {
    taskId?: string;
    taskName?: string;
    taskPrice?: string | number;
    clientId?: string;
    clientName?: string;
    contractorId?: string;
    taskAssignmentId?: string;
  };
};

/**
 * InvoiceForm component for creating or updating invoices.
 * Handles invoice item management, total price calculation, and form submission.
 * 
 * @param {InvoiceFormProps} props - Component props
 * @returns {JSX.Element} Form for creating or updating invoices
 */
const InvoiceForm = ({ type, invoice, prefillData }: InvoiceFormProps) => {
  const { toast } = useToast();
  const router = useRouter();
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItems[]>([]);
  const [totalPrice, setTotalPrice] = useState(0);

  // New state for existing invoices
  const [existingInvoices, setExistingInvoices] = useState<Array<{
    id: string;
    invoiceNumber: string;
    createdAt: Date;
  }>>([]);

  // Initialize the form with prefill data if available
  const form = useForm<z.infer<typeof insertInvoiceSchema>>({
    resolver: zodResolver(insertInvoiceSchema),
    defaultValues: {
      clientId: prefillData?.clientId || "",
      contractorId: prefillData?.contractorId || "",
      items: prefillData?.taskId ? [
        {
          taskId: prefillData.taskId,
          quantity: 1,
          price: typeof prefillData.taskPrice === 'number' 
            ? prefillData.taskPrice
            : prefillData.taskPrice ? Number(prefillData.taskPrice) : 0
        }
      ] : [],
      totalPrice: typeof prefillData?.taskPrice === 'number' 
        ? prefillData.taskPrice 
        : prefillData?.taskPrice ? Number(prefillData.taskPrice) : 0
    }
  });

  // State for storing client and contractor details
  const [clientInfo, setClientInfo] = useState({
    name: prefillData?.clientName || "",
    email: ""
  });
  const [contractorInfo, setContractorInfo] = useState({
    name: "",
    email: ""
  });

  // Fetch client and contractor information
  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        // Fetch client details if we have client ID
        if (prefillData?.clientId) {
          try {
            const clientData = await getUserById(prefillData.clientId);
            setClientInfo({
              name: clientData.name || prefillData.clientName || "",
              email: clientData.email || ""
            });
          } catch (error) {
            console.error("Error fetching client details:", error);
          }
        }

        // Fetch contractor details if we have contractor ID
        if (prefillData?.contractorId) {
          try {
            const contractorData = await getUserById(prefillData.contractorId);
            setContractorInfo({
              name: contractorData.name || "",
              email: contractorData.email || ""
            });
          } catch (error) {
            console.error("Error fetching contractor details:", error);
          }
        }
      } catch (error) {
        console.error("Error in fetchUserDetails:", error);
      }
    };

    fetchUserDetails();
  }, [prefillData?.clientId, prefillData?.contractorId, prefillData?.clientName]);

  // Initialize invoice items based on prefill data
  useEffect(() => {
    if (prefillData?.taskId) {
      const initialItem = {
        taskId: prefillData.taskId,
        name: prefillData.taskName || "Task Service",
        price: typeof prefillData.taskPrice === 'number' 
          ? prefillData.taskPrice.toFixed(2) 
          : prefillData.taskPrice || "0.00",
        qty: 1
      };
      setInvoiceItems([initialItem]);
      
      // Set initial total price
      const price = typeof prefillData.taskPrice === 'number' 
        ? prefillData.taskPrice 
        : parseFloat(prefillData.taskPrice || "0");
      setTotalPrice(price);
    }
  }, [prefillData]);

  // Check for existing invoices when task assignment ID is available
  useEffect(() => {
    const checkForExistingInvoices = async () => {
      if (prefillData?.taskAssignmentId) {
        try {
          const historyModule = await import('@/lib/actions/task-assignment.actions');
          const { getTaskAssignmentInvoiceHistory } = historyModule;
          
          const history = await getTaskAssignmentInvoiceHistory(prefillData.taskAssignmentId);
          if (history.invoiced) {
            setExistingInvoices(history.invoices);
          }
        } catch (error) {
          console.error("Error checking for existing invoices:", error);
        }
      }
    };

    checkForExistingInvoices();
  }, [prefillData?.taskAssignmentId]);

  /**
   * Adds a new empty invoice item to the form.
   */
  const handleAddItem = () => {
    try {
      // Create a new item for the local state
      const newItem = {
        taskId: "",
        name: "Service description",
        price: "0.00",
        qty: 1
      };
      
      // Create the matching form item with the correct schema structure
      const formItem = {
        taskId: newItem.taskId,
        quantity: newItem.qty, // Match the form schema field 'quantity' instead of 'qty'
        price: parseFloat(newItem.price)
      };
      
      // First update the local state for UI rendering
      const updatedItems = [...invoiceItems, newItem];
      setInvoiceItems(updatedItems);
      
      // Then update the form value with all items
      const currentItems = form.getValues("items") || [];
      form.setValue("items", [...currentItems, formItem]);
      
      console.log("Added new item:", newItem);
      console.log("Current form items:", form.getValues("items"));
    } catch (error) {
      console.error("Error adding invoice item:", error);
      toast({
        title: "Error",
        description: "Failed to add invoice item",
        variant: "destructive",
      });
    }
  };

  /**
   * Removes an invoice item from the form at the specified index.
   * Recalculates total price after removal.
   * 
   * @param {number} index - The index of the item to remove
   */
  const handleRemoveItem = (index: number) => {
    try {
      console.log("Removing item at index:", index);
      
      // Update local state by filtering out the item at the specified index
      const updatedItems = invoiceItems.filter((_, i) => i !== index);
      setInvoiceItems(updatedItems);
      
      // Transform UI items to match form schema format
      const formItems = updatedItems.map(item => ({
        taskId: item.taskId,
        quantity: item.qty || 1,  // Field 'quantity' in form schema matches 'qty' in UI
        price: parseFloat(item.price)
      }));
      
      // Update form values
      form.setValue("items", formItems);
      
      // Recalculate total price
      const total = updatedItems.reduce((sum, item) => {
        return sum + (parseFloat(item.price) * (item.qty || 1));
      }, 0);
      setTotalPrice(total);
      form.setValue("totalPrice", total);
      
      console.log("Updated form items after removal:", form.getValues("items"));
    } catch (error) {
      console.error("Error removing invoice item:", error);
      toast({
        title: "Error",
        description: "Failed to remove invoice item",
        variant: "destructive",
      });
    }
  };

  /**
   * Updates a specific field of an invoice item at the specified index.
   * Recalculates total price if price or quantity changes.
   * 
   * @param {number} index - The index of the item to update
   * @param {string} field - The field name to update (taskId, name, price, qty)
   * @param {string | number} value - The new value for the field
   */
  const handleItemChange = (index: number, field: string, value: string | number) => {
    try {
      // Make a copy of the current items
      const updatedItems = [...invoiceItems];
      
      // Update the specific field in the local state
      updatedItems[index] = { ...updatedItems[index], [field]: value };
      setInvoiceItems(updatedItems);
      
      // Get the current form values
      const formItems = form.getValues("items") || [];
      
      // Update the correct field in the form schema
      if (field === 'taskId') {
        if (formItems[index]) {
          formItems[index].taskId = String(value);
        }
      } else if (field === 'name') {
        // Name field is only in local state, not in form schema
      } else if (field === 'price') {
        if (formItems[index]) {
          formItems[index].price = typeof value === 'string' ? parseFloat(value) : value;
        }
      } else if (field === 'qty') {
        if (formItems[index]) {
          // Map qty in UI to quantity in form schema
          formItems[index].quantity = typeof value === 'string' ? parseInt(value, 10) : value;
        }
      }
      
      // Update the form with all items
      form.setValue("items", formItems);
      
      // Recalculate total price for price or quantity changes
      if (field === 'price' || field === 'qty') {
        const total = updatedItems.reduce((sum, item) => {
          const itemPrice = parseFloat(String(item.price));
          const itemQty = item.qty || 1;
          return sum + (itemPrice * itemQty);
        }, 0);
        setTotalPrice(total);
        form.setValue("totalPrice", total);
      }
      
      console.log(`Updated item ${index}, field ${field}:`, value);
      console.log("Current form items:", form.getValues("items"));
    } catch (error) {
      console.error(`Error updating item ${index}, field ${field}:`, error);
    }
  };

  /**
   * Handles form submission, creating a new invoice with the entered data.
   * Displays a toast notification on success or failure.
   * 
   * @param {z.infer<typeof insertInvoiceSchema>} values - The form values
   */
  const onSubmit = async (values: z.infer<typeof insertInvoiceSchema>) => {
    try {
      const result = await createInvoice(values);
      
      if (result.success) {
        toast({
          title: "Success",
          description: "Invoice created successfully",
        });
        router.push('/user/dashboard/contractor/invoices');
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to create invoice",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to create invoice:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {existingInvoices.length > 0 && (
          <Alert variant="warning" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Previous invoices exist</AlertTitle>
            <AlertDescription>
              This task assignment already has {existingInvoices.length} invoice(s). 
              Creating an additional invoice might be needed for corrections or credit notes, but could lead to duplicate billing.
              <div className="mt-2">
                <strong>Existing invoices:</strong>
                <ul className="list-disc pl-5 mt-1">
                  {existingInvoices.map(invoice => (
                    <li key={invoice.id}>
                      Invoice #{invoice.invoiceNumber} - Created on {new Date(invoice.createdAt).toLocaleDateString()}
                    </li>
                  ))}
                </ul>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Client Information */}
          <div className="p-4 border rounded-lg bg-gray-50">
            <h3 className="font-semibold mb-4">Client Information</h3>
            <div className="space-y-4">
              {/* Hide client ID but keep it in the form data */}
              <input 
                type="hidden" 
                {...form.register("clientId")} 
                value={prefillData?.clientId || ""}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <FormLabel>Client Name</FormLabel>
                  <Input 
                    value={clientInfo.name} 
                    onChange={(e) => setClientInfo({...clientInfo, name: e.target.value})}
                    placeholder="Client Name" 
                    readOnly={Boolean(prefillData?.clientName)}
                  />
                </div>
                <div>
                  <FormLabel>Client Email</FormLabel>
                  <Input 
                    value={clientInfo.email} 
                    onChange={(e) => setClientInfo({...clientInfo, email: e.target.value})}
                    placeholder="Client Email" 
                    readOnly={Boolean(clientInfo.email)}
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Contractor Information */}
          <div className="p-4 border rounded-lg bg-gray-50">
            <h3 className="font-semibold mb-4">Contractor Information</h3>
            <div className="space-y-4">
              {/* Hide contractor ID but keep it in the form data */}
              <input 
                type="hidden" 
                {...form.register("contractorId")} 
                value={prefillData?.contractorId || ""}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <FormLabel>Contractor Name</FormLabel>
                  <Input 
                    value={contractorInfo.name} 
                    onChange={(e) => setContractorInfo({...contractorInfo, name: e.target.value})}
                    placeholder="Contractor Name" 
                    readOnly={Boolean(contractorInfo.name)}
                  />
                </div>
                <div>
                  <FormLabel>Contractor Email</FormLabel>
                  <Input 
                    value={contractorInfo.email} 
                    onChange={(e) => setContractorInfo({...contractorInfo, email: e.target.value})}
                    placeholder="Contractor Email" 
                    readOnly={Boolean(contractorInfo.email)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Invoice Items Table */}
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Price</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoiceItems.map((item, index) => (
                <TableRow key={`invoice-item-${index}`}>
                  <TableCell className="font-medium">{index + 1}</TableCell>
                  <TableCell>
                    {/* Hidden task ID field */}
                    <input 
                      type="hidden"
                      value={item.taskId} 
                      onChange={(e) => handleItemChange(index, 'taskId', e.target.value)}
                    />
                    <Input 
                      value={item.name} 
                      onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                      className="w-full"
                      placeholder="Service description"
                    />
                  </TableCell>
                  <TableCell>
                    <Input 
                      type="number" 
                      value={item.qty} 
                      onChange={(e) => handleItemChange(index, 'qty', parseInt(e.target.value))}
                      className="w-20"
                    />
                  </TableCell>
                  <TableCell>
                    <Input 
                      type="number"
                      value={item.price} 
                      onChange={(e) => {
                        // Convert to a proper number and handle validation
                        const value = e.target.value;
                        const numValue = parseFloat(value);
                        if (!isNaN(numValue)) {
                          handleItemChange(index, 'price', value);
                        } else if (value === '') {
                          // Allow empty field during typing
                          handleItemChange(index, 'price', '0');
                        }
                      }}
                      step="0.01"
                      min="0"
                      className="w-full"
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    {invoiceItems.length > 1 ? (
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleRemoveItem(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    ) : (
                      <span className="px-2">
                        {/* No delete button when there's only one item */}
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {invoiceItems.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                    No invoice items added yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        
        <div className="flex justify-between items-center">
          <Button type="button" onClick={handleAddItem} variant="outline">
            Add Item
          </Button>
          
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Total:</p>
            <p className="text-lg font-semibold">{formatCurrency(totalPrice)}</p>
            <Input 
              type="hidden" 
              {...form.register("totalPrice")} 
              value={totalPrice.toFixed(2)}
            />
          </div>
        </div>

        <Button type="submit" className="w-full">
          {type === 'Create' ? 'Create Invoice' : 'Update Invoice'}
        </Button>
      </form>
    </Form>
  );
};

export default InvoiceForm; 
