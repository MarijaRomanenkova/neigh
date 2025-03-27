/**
 * Create Task Page Component
 * @module Pages
 * @group Dashboard/Client
 * 
 * This page provides a form for creating new tasks.
 * It allows clients to specify task details, category, and budget.
 */

import { Metadata } from 'next';
import { getCategories } from '@/lib/actions/category.actions';
import TaskForm from '@/components/shared/task/task-form';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

/**
 * Metadata for the Create Task page
 * Sets the page title for SEO purposes
 */
export const metadata: Metadata = {
  title: 'Create task',
};

/**
 * Create Task Page Component
 * 
 * Renders a form for creating new tasks with all necessary fields.
 * Fetches available categories for task categorization.
 * Includes authentication protection and redirects unauthenticated users.
 * 
 * @returns {Promise<JSX.Element>} The rendered task creation page with form
 */
export default async function CreateTaskPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  
  const categories = await getCategories();
  
  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Create New Task</h1>
      <TaskForm 
        type="Create" 
        task={null}
        categories={categories}
        userId={session.user.id}
      />
    </div>
  );
}
