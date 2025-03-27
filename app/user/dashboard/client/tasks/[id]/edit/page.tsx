/**
 * Edit Task Page Component
 * @module Pages
 * @group Dashboard/Client
 * 
 * This page provides a form for editing existing tasks.
 * It pre-fills the form with the current task data and allows updating all fields.
 */

import { getCategories } from '@/lib/actions/category.actions';
import { getTaskById } from '@/lib/actions/task.actions';
import TaskForm from '@/components/shared/task/task-form';
import { notFound, redirect } from 'next/navigation';
import { Task } from '@/types';
import { auth } from '@/auth';

/**
 * Edit Task Page Component
 * 
 * Renders a form for editing an existing task with pre-filled data.
 * Fetches the task data and available categories.
 * Includes authentication protection and redirects unauthenticated users.
 * Shows a 404 page if the requested task doesn't exist.
 * 
 * @param {Object} props - Component properties
 * @param {Promise<{id: string}>} props.params - Route parameters containing the task ID
 * @returns {Promise<JSX.Element>} The rendered task edit page with form
 */
export default async function EditTaskPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect('/sign-in');

  // Await the params to get the id
  const { id } = await params;

  const [task, categories] = await Promise.all([
    getTaskById(id),
    getCategories()
  ]);

  if (!task) {
    notFound();
  }

  const taskWithNumberPrice = {
    ...task,
    price: Number(task.price)
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Edit Task</h1>
      <TaskForm 
        type="Update" 
        task={taskWithNumberPrice as Task}
        taskId={id}
        categories={categories}
        userId={session.user.id}
      />
    </div>
  );
} 
