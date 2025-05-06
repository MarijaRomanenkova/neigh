'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

/**
 * Create Task Button Component
 * @module Components
 * @group Shared/Tasks
 * 
 * A reusable button component for creating new tasks across the application.
 * Features include:
 * - Consistent styling with success variant
 * - Plus icon for visual clarity
 * - Configurable size and variant
 * - Direct navigation to task creation
 * 
 * @example
 * ```tsx
 * <CreateTaskButton
 *   className="custom-class"
 *   variant="success"
 *   size="default"
 * />
 * ```
 */

/**
 * Props for the CreateTaskButton component
 * @interface CreateTaskButtonProps
 */
interface CreateTaskButtonProps {
  /** Optional CSS class names */
  className?: string;
  /** Button styling variant */
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | 'success';
  /** Button size */
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

/**
 * CreateTaskButton component that provides a consistent button for creating new tasks.
 * Uses success variant by default with the plus icon for visual consistency.
 * 
 * @param {CreateTaskButtonProps} props - Component properties
 * @returns {JSX.Element} A button that navigates to the task creation page
 */
const CreateTaskButton: React.FC<CreateTaskButtonProps> = ({ 
  className = "",
  variant = "success",
  size = "default" 
}) => {
  return (
    <Button 
      variant={variant} 
      size={size}
      asChild 
      className={`whitespace-nowrap flex items-center ${className}`}
    >
      <Link href="/user/dashboard/client/tasks/create">
        <Plus className="mr-2 h-4 w-4" /> Create Task
      </Link>
    </Button>
  );
};

export default CreateTaskButton; 
