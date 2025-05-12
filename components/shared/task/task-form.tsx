'use client';

/**
 * Task Form Component
 * @module Components
 * @group Shared/Task
 * 
 * A client-side component that provides a form for creating and updating tasks.
 * Features include:
 * - Form validation using Zod schemas
 * - Image upload with preview
 * - Category selection
 * - Price input with validation
 * - Description editor
 * - Automatic slug generation
 * - Toast notifications for feedback
 * 
 * @example
 * ```tsx
 * <TaskForm
 *   type="Create"
 *   task={null}
 *   categories={[
 *     { id: "1", name: "Gardening" },
 *     { id: "2", name: "Cleaning" }
 *   ]}
 *   userId="user123"
 * />
 * ```
 */

import { useToast } from '@/hooks/use-toast';
import { taskDefaultValues } from '@/lib/constants';
import { insertTaskSchema, updateTaskSchema } from '@/lib/validators';
import { Category, Task } from '@/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { ControllerRenderProps, SubmitHandler, useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../../ui/form';
import { Input } from '../../ui/input';
import { Button } from '../../ui/button';
import { Textarea } from '../../ui/textarea';
import { createTask, updateTask } from '@/lib/actions/task.actions';
import { UploadButton, UploadDropzone } from '@/lib/uploadthing';
import { Card, CardContent } from '../../ui/card';
import Image from 'next/image';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from '@/components/ui/label';
import { UploadCloud } from 'lucide-react';
import { useState } from 'react';

/**
 * Props for the TaskForm component
 * @interface TaskFormProps
 */
interface TaskFormProps {
  /** The form mode (create new task or update existing) */
  type: 'Create' | 'Update';
  /** Existing task data for update mode (null for create) */
  task: Task | null;
  /** ID of the task being updated */
  taskId?: string;
  /** Available categories for selection */
  categories: {
    /** Category ID */
    id: string;
    /** Category name */
    name: string;
  }[];
  /** ID of the user creating/updating the task */
  userId: string;
}

/**
 * Task Form Component
 * 
 * Renders a comprehensive form for creating and updating tasks with:
 * - Name and slug fields with automatic slug generation
 * - Category selection from available options
 * - Price input with proper validation
 * - Image upload functionality with preview
 * - Description editor
 * - Proper validation using Zod schemas
 * - Toast notifications for success/error states
 * 
 * Handles both creation and update workflows with appropriate API calls.
 * 
 * @param {TaskFormProps} props - Component properties
 * @returns {JSX.Element} The rendered task form
 */
const TaskForm = ({
  type,
  task = null,
  taskId,
  categories,
  userId
}: TaskFormProps) => {
  const router = useRouter();
  const { toast } = useToast();

  // Initialize form with appropriate schema and default values
  const form = useForm<z.infer<typeof insertTaskSchema>>({
    resolver:
      type === 'Update'
        ? zodResolver(updateTaskSchema)
        : zodResolver(insertTaskSchema),
    defaultValues:
      task && type === 'Update' 
        ? {
            name: task.name,
            categoryId: task.categoryId,
            description: task.description || '',
            images: task.images,
            price: Number(task.price)
          } 
        : taskDefaultValues,
  });

  /**
   * Form submission handler
   * Handles both create and update scenarios with appropriate API calls
   * 
   * @param {z.infer<typeof insertTaskSchema>} values - Form values
   */
  const onSubmit: SubmitHandler<z.infer<typeof insertTaskSchema>> = async (
    values
  ) => {
    // On Create
    if (type === 'Create') {
      const formData = new FormData();
      Object.entries(values).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          value.forEach(v => formData.append(key, v));
        } else {
          formData.append(key, String(value));
        }
      });

      const res = await createTask(formData);

      if (!res.success) {
        toast({
          variant: 'destructive',
          description: res.message,
        });
      } else {
        toast({
          description: res.message,
        });
        router.push('/user/dashboard/client/tasks');
      }
    }

    // On Update
    if (type === 'Update') {
      if (!taskId) {
        router.push('/user/dashboard/client/tasks');
        return;
      }

      const res = await updateTask({ ...values, id: taskId } as z.infer<typeof insertTaskSchema> & { id: string });

      if (!res.success) {
        toast({
          variant: 'destructive',
          description: res.message,
        });
      } else {
        toast({
          description: res.message,
        });
        router.push('/user/dashboard/client/tasks');
      }
    }
  };

  // Watch images field for preview functionality
  const images = form.watch('images');

  return (
    <Form {...form}>
      <form
        method='POST'
        onSubmit={form.handleSubmit(onSubmit)}
        className='space-y-8'
      >
        <div className='grid gap-2'>
          <Label htmlFor='name'>Name</Label>
          <Input
            id='name'
            placeholder='Enter task name'
            {...form.register('name')}
          />
          {form.formState.errors.name && (
            <p className='text-sm text-red-500'>
              {form.formState.errors.name.message}
            </p>
          )}
        </div>
        <div className='flex flex-col md:flex-row gap-5'>
          {/* Category */}
          <FormField
            control={form.control}
            name='categoryId'
            render={({ field }) => (
              <FormItem className='w-full'>
                <FormLabel>Category</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <SelectTrigger className='w-full'>
                    <SelectValue placeholder='Select category' />
                  </SelectTrigger>
                  <SelectContent className='min-w-[200px]'>
                    {categories?.map((category) => (
                      <SelectItem 
                        key={category.id} 
                        value={category.id}
                      >
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
      
          {/* Price */}
          <FormField
            control={form.control}
            name='price'
            render={({ field }) => (
              <FormItem className='w-full'>
                <FormLabel>Price</FormLabel>
                <FormControl>
                  <Input 
                    type="number"
                    placeholder='Enter task price' 
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                    value={field.value || ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className='upload-field flex flex-col md:flex-row gap-5'>
          {/* Images */}
          <FormField
            control={form.control}
            name='images'
            render={() => (
              <FormItem className='w-full'>
                <FormLabel>Images</FormLabel>
                <Card>
                  <CardContent className='space-y-4 mt-2'>
                    {/* Image Preview Grid */}
                    {images.length > 0 && (
                      <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                        {images.map((image: string) => (
                          <div key={image} className="relative group">
                            <Image
                              src={image}
                              alt='task image'
                              className='w-full h-32 object-cover object-center rounded-md'
                              width={150}
                              height={150}
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => {
                                const updatedImages = images.filter(img => img !== image);
                                form.setValue('images', updatedImages);
                              }}
                            >
                              ×
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Upload Area - Use UploadDropzone with custom styling */}
                    <div className="min-h-[200px] max-h-[200px] border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg transition-colors hover:border-primary overflow-hidden">
                      <UploadDropzone
                        endpoint="imageUploader"
                        onClientUploadComplete={(res: { url: string }[]) => {
                          if (res.length > 0) {
                            form.setValue('images', [...images, ...res.map(file => file.url)]);
                            toast({
                              description: `${res.length} image(s) uploaded successfully!`,
                            });
                          }
                        }}
                        onUploadError={(error: Error) => {
                          toast({
                            variant: 'destructive',
                            description: `ERROR! ${error.message}`,
                          });
                        }}
                        className="p-0 w-full h-full"
                        content={{
                          label: "Drag & drop your images here",
                          allowedContent: "Max file size: 4MB"
                        }}
                        appearance={{
                          container: "w-full h-full flex flex-col items-center justify-center",
                          label: "text-base font-medium mb-1",
                          allowedContent: "text-xs text-muted-foreground mb-2",
                          button: "bg-secondary hover:bg-secondary/80 text-secondary-foreground text-sm py-1 px-3",
                          uploadIcon: "w-6 h-6 text-primary"
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
    
        <div>
          {/* Description */}
          <FormField
            control={form.control}
            name='description'
            render={({
              field,
            }: {
              field: ControllerRenderProps<
                z.infer<typeof insertTaskSchema>,
                'description'
              >;
            }) => (
              <FormItem className='w-full'>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder='Enter task description'
                    className='resize-none'
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div>
          <Button
            type='submit'
            size='lg'
            disabled={form.formState.isSubmitting}
            className='button col-span-2 w-full'
          >
            {form.formState.isSubmitting ? 'Submitting' : `${type} task`}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default TaskForm;
