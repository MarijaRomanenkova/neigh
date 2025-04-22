'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface CreateTaskButtonProps {
  className?: string;
  variant?: 'default' | 'success' | 'outline' | 'secondary' | 'ghost' | 'destructive' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

/**
 * Reusable Create Task Button Component
 * 
 * A consistent button for creating new tasks across the application.
 * Uses success variant by default with the plus icon for visual consistency.
 * 
 * @param {CreateTaskButtonProps} props - Component properties
 * @returns {JSX.Element} Consistent Create Task button
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
