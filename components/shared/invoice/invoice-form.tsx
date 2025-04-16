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
import { Trash2 } from "lucide-react";

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

  /**
   * Adds a new empty invoice item to the form.
   */
  const handleAddItem = () => {
    const newItem = {
      taskId: "",
      name: "",
      price: "0.00",
      qty: 1
    };
    setInvoiceItems([...invoiceItems, newItem]);
    
    // Fix: Use the correct form field and transform to match schema format
    const formItem = {
      taskId: newItem.taskId,
      quantity: newItem.qty,
      price: parseFloat(newItem.price)
    };
    form.setValue("items", [...(form.getValues("items") || []), formItem]);
  };

  /**
   * Removes an invoice item from the form at the specified index.
   * Recalculates total price after removal.
   * 
   * @param {number} index - The index of the item to remove
   */
  const handleRemoveItem = (index: number) => {
    const updatedItems = invoiceItems.filter((_, i) => i !== index);
    setInvoiceItems(updatedItems);
    
    // Transform UI items to match form schema format
    const formItems = updatedItems.map(item => ({
      taskId: item.taskId,
      quantity: item.qty || 1,  // Ensure quantity is always a number
      price: parseFloat(item.price)
    }));
    form.setValue("items", formItems);
    
    // Recalculate total price
    const total = updatedItems.reduce((sum, item) => {
      return sum + (parseFloat(item.price) * (item.qty || 1));
    }, 0);
    setTotalPrice(total);
    form.setValue("totalPrice", total);
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
    const updatedItems = [...invoiceItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setInvoiceItems(updatedItems);
    
    // Set the form value with type-safe approach
    if (field === 'taskId') {
      form.setValue(`items.${index}.taskId` as const, String(value));
    } else if (field === 'name') {
      // Name field doesn't exist in form schema, so we don't update it
    } else if (field === 'price') {
      form.setValue(`items.${index}.price` as const, typeof value === 'string' ? parseFloat(value) : value);
    } else if (field === 'qty') {
      form.setValue(`items.${index}.quantity` as const, typeof value === 'string' ? parseInt(value, 10) : value);
    }
    
    // Recalculate total price for price or qty changes
    if (field === 'price' || field === 'qty') {
      const total = updatedItems.reduce((sum, item) => {
        return sum + (parseFloat(item.price) * (item.qty || 1));
      }, 0);
      setTotalPrice(total);
      form.setValue("totalPrice", total);
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
        
        {/* Client Info (display only) */}
        {prefillData?.clientName && (
          <div className="bg-muted p-4 rounded-md mb-4">
            <h3 className="font-medium mb-2">Client Information</h3>
            <p>{prefillData.clientName}</p>
          </div>
        )}
        
        {/* Invoice Items Table */}
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task ID</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Price</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoiceItems.map((item, index) => (
                <TableRow key={`invoice-item-${index}`}>
                  <TableCell>
                    <Input 
                      value={item.taskId} 
                      onChange={(e) => handleItemChange(index, 'taskId', e.target.value)}
                      disabled={Boolean(prefillData?.taskId && index === 0)}
                      className="w-full"
                    />
                  </TableCell>
                  <TableCell>
                    <Input 
                      value={item.name} 
                      onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                      className="w-full"
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
                      value={item.price} 
                      onChange={(e) => handleItemChange(index, 'price', e.target.value)}
                      className="w-full"
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleRemoveItem(index)}
                      disabled={Boolean(prefillData?.taskId && index === 0 && invoiceItems.length === 1)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
