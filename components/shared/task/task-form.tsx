'use client';

/**
 * Task Form Component
 * @module Components
 * @group Shared/Task
 * 
 * This client-side component provides a form for creating and updating tasks,
 * with validation, image uploads, and category selection.
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
import slugify from 'slugify';
import { Input } from '../../ui/input';
import { Button } from '../../ui/button';
import { Textarea } from '../../ui/textarea';
import { createTask, updateTask } from '@/lib/actions/task.actions';
import { UploadButton } from '@/lib/uploadthing';
import { Card, CardContent } from '../../ui/card';
import Image from 'next/image';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { prisma } from '@/db/prisma';
import { auth } from "@/auth";

/**
 * Props for the TaskForm component
 * @interface TaskFormProps
 * @property {'Create'|'Update'} type - The form mode (create new task or update existing)
 * @property {Task|null} task - Existing task data for update mode (null for create)
 * @property {string} [taskId] - ID of the task being updated
 * @property {Object[]} categories - Available categories for selection
 * @property {string} categories[].id - Category ID
 * @property {string} categories[].name - Category name
 * @property {string} userId - ID of the user creating/updating the task
 */
type TaskFormProps = {
  type: 'Create' | 'Update';
  task: Task | null;
  taskId?: string;
  categories: {
    id: string;
    name: string;
  }[];
  userId: string;
};

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
            ...task,
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
      const res = await createTask({
        ...values,
        userId: userId
      });

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
        <div className='flex flex-col md:flex-row gap-5'>
          {/* Name */}
          <FormField
            control={form.control}
            name='name'
            render={({
              field,
            }: {
              field: ControllerRenderProps<
                z.infer<typeof insertTaskSchema>,
                'name'
              >;
            }) => (
              <FormItem className='w-full'>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder='Enter task name' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {/* Slug */}
          <FormField
            control={form.control}
            name='slug'
            render={({
              field,
            }: {
              field: ControllerRenderProps<
                z.infer<typeof insertTaskSchema>,
                'slug'
              >;
            }) => (
              <FormItem className='w-full'>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <div className='relative'>
                    <Input placeholder='Enter slug' {...field} />
                    <Button
                      type='button'
                      className='bg-gray-500 hover:bg-gray-600 text-white px-4 py-1 mt-2'
                      onClick={() => {
                        form.setValue(
                          'slug',
                          slugify(form.getValues('name'), { lower: true })
                        );
                      }}
                    >
                      Generate
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
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
                    <SelectItem value="none">Select a category</SelectItem>
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
                  <CardContent className='space-y-2 mt-2 min-h-48'>
                    <div className='flex-start space-x-2'>
                      {images.map((image: string) => (
                        <Image
                          key={image}
                          src={image}
                          alt='task image'
                          className='w-20 h-20 object-cover object-center rounded-sm'
                          width={100}
                          height={100}
                        />
                      ))}
                      <FormControl>
                        <UploadButton
                          endpoint='imageUploader'
                          onClientUploadComplete={(res: { url: string }[]) => {
                            form.setValue('images', [...images, res[0].url]);
                          }}
                          onUploadError={(error: Error) => {
                            toast({
                              variant: 'destructive',
                              description: `ERROR! ${error.message}`,
                            });
                          }}
                        />
                      </FormControl>
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
