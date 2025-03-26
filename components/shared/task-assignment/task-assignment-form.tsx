'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { insertTaskAssignmentSchema } from '@/lib/validators';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { createTaskAssignment, deleteTaskAssignment } from '@/lib/actions/task-assignment.actions';
import { Prisma } from '@prisma/client';
import DeleteDialog from '@/components/shared/delete-dialog';

type TaskAssignmentFormProps = {
  taskId?: string;
  clientId?: string;
  contractors: { id: string; name: string }[];
  statuses: { id: string; name: string }[];
  type: 'Create' | 'Update';
  assignment?: Prisma.TaskAssignmentGetPayload<{
    include: {
      task: {
        select: {
          name: true;
          price: true;
          description: true;
          images: true;
          category: { select: { name: true } }
        }
      };
      status: { select: { name: true; color: true } };
      client: { select: { name: true; email: true } };
      contractor: { select: { name: true; email: true } };
    }
  }>;
  assignmentId?: string;
};

export function TaskAssignmentForm({ 
  taskId, 
  clientId, 
  contractors, 
  statuses,
  type,
  assignment,
  assignmentId 
}: TaskAssignmentFormProps) {
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof insertTaskAssignmentSchema>>({
    resolver: zodResolver(insertTaskAssignmentSchema),
    defaultValues: {
      taskId,
      clientId,
      contractorId: '',
      statusId: ''
    }
  });

  async function onSubmit(data: z.infer<typeof insertTaskAssignmentSchema>) {
    const result = await createTaskAssignment(data);
    
    if (!result.success) {
      toast({
        variant: 'destructive',
        description: result.message
      });
      return;
    }

    toast({
      description: result.message
    });
    
    form.reset();
  }

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="contractorId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contractor</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select contractor" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {contractors.map((contractor) => (
                      <SelectItem key={contractor.id} value={contractor.id}>
                        {contractor.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="statusId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {statuses.map((status) => (
                      <SelectItem key={status.id} value={status.id}>
                        {status.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button 
            type="submit" 
            disabled={form.formState.isSubmitting}
            className="w-full"
          >
            {form.formState.isSubmitting ? 'Assigning...' : 'Assign Task'}
          </Button>
        </form>
      </Form>

      {type === 'Update' && assignmentId && (
        <div className="pt-6 border-t">
          <DeleteDialog 
            id={assignmentId}
            action={deleteTaskAssignment}
            variant="outline"
          />
        </div>
      )}
    </div>
  );
}
