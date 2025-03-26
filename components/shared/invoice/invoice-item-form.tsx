'use client';

import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { invoiceItemsSchema } from "@/lib/validators";
import { z } from "zod";
import { UseFormReturn } from "react-hook-form";

type InvoiceItemFormProps = {
  index: number;
  onRemove: () => void;
  form: UseFormReturn<{
    invoiceItem: z.infer<typeof invoiceItemsSchema>[];
    // ... other form fields
  }>;
};

const InvoiceItemForm = ({ index, onRemove, form }: InvoiceItemFormProps) => {
  return (
    <div className="border p-4 rounded-lg mb-4">
      <FormField
        control={form.control}
        name={`invoiceItem.${index}.taskId`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Task</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name={`invoiceItem.${index}.qty`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Quantity</FormLabel>
            <FormControl>
              <Input 
                type="number" 
                {...field}
                onChange={(e) => field.onChange(Number(e.target.value))}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <Button 
        type="button" 
        variant="destructive" 
        onClick={onRemove}
        className="mt-2"
      >
        Remove Item
      </Button>
    </div>
  );
};

export default InvoiceItemForm; 
