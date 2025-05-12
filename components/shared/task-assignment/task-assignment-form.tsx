'use client';

/**
 * @module TaskAssignmentForm
 * @description A form component for creating or updating task assignments.
 * This component handles assigning tasks to contractors with specific statuses.
 * It supports both creation and update modes.
 */

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { insertTaskAssignmentSchema } from '@/lib/validators';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { createTaskAssignment } from '@/lib/actions/task-assignment.actions';
import { Prisma } from '@prisma/client';

/**
 * @interface TaskAssignmentFormProps
 * @property {string} [taskId] - Optional ID of the task to be assigned
 * @property {string} [clientId] - Optional ID of the client who created the task
 * @property {Array<{id: string; name: string}>} contractors - List of available contractors to assign the task to
 * @property {Array<{id: string; name: string}>} statuses - List of available statuses for the assignment
 * @property {'Create' | 'Update'} type - Determines if the form is for creating or updating an assignment
 * @property {Prisma.TaskAssignmentGetPayload} [assignment] - Optional existing assignment data when updating
 * @property {string} [assignmentId] - Optional ID of the assignment when updating
 */
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

/**
 * TaskAssignmentForm component for creating or updating task assignments.
 * Renders a form with contractor and status selection fields.
 * 
 * @param {Object} props - Component props
 * @param {string} [props.taskId] - ID of the task to be assigned
 * @param {string} [props.clientId] - ID of the client who created the task
 * @param {Array<{id: string; name: string}>} props.contractors - Available contractors
 * @param {Array<{id: string; name: string}>} props.statuses - Available assignment statuses
 * @param {'Create' | 'Update'} props.type - Whether creating or updating an assignment
 * @param {Prisma.TaskAssignmentGetPayload} [props.assignment] - Existing assignment data (for updates)
 * @param {string} [props.assignmentId] - ID of the assignment (for updates)
 * @returns {JSX.Element} A form for task assignment creation or management
 */
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
  
  // Initialize form with zod validation schema
  const form = useForm<z.infer<typeof insertTaskAssignmentSchema>>({
    resolver: zodResolver(insertTaskAssignmentSchema),
    defaultValues: {
      taskId,
      clientId,
      contractorId: '',
      statusId: ''
    }
  });

  /**
   * Handles form submission to create a task assignment.
   * Shows appropriate toast messages on success or failure.
   * 
   * @async
   * @param {z.infer<typeof insertTaskAssignmentSchema>} data - The validated form data
   * @returns {Promise<void>}
   */
  async function onSubmit(data: z.infer<typeof insertTaskAssignmentSchema>) {
    try {
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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      toast({
        variant: 'destructive',
        description: errorMessage
      });
    }
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
    </div>
  );
}
