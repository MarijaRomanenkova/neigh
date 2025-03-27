/**
 * Task Card Component
 * @module Components
 * @group Shared/Tasks
 * 
 * This component renders a card displaying task information in a compact format,
 * intended for use in grids or lists of tasks.
 */

import Image from 'next/image';
import Link from 'next/link';
import TaskPrice from './task-price';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Task } from '@/types';
import { UserIcon, ArrowRight } from 'lucide-react';

/**
 * Task Card Component
 * 
 * Renders a card UI for a task with:
 * - Task name and truncated description
 * - Price display (or "For negotiation" if no price)
 * - Author information
 * - "See more" button linking to task details
 * 
 * Uses shadcn/ui Card components for consistent styling.
 * 
 * @param {Object} props - Component properties
 * @param {Task} props.task - Task data to display
 * @returns {JSX.Element} The rendered task card
 */
const TaskCard = ({ task }: { task: Task }) => {
  return (
    <Card className='w-full max-w-m'>
      <CardHeader className='p-0 relative'>
    
        {/* Price positioned in top right corner */}
        <div className='absolute top-2 right-2 p-2'>
          {task.price ? (
            <TaskPrice value={Number(task.price)} className="text-xl font-medium" />
          ) : (
            <p className="text-xl font-medium">For negotiation</p>
          )}
        </div>
      </CardHeader>
      <CardContent className='p-4 grid gap-4'>
        <Link href={`/user/dashboard/client/tasks/${task.id}`}>
          <h2 className='text-xl font-medium'>{task.name}</h2>
        </Link>
        {task.description ? (
          <p className="text-sm text-muted-foreground truncate">{task.description}</p>
        ) : (
          <p className="text-sm text-muted-foreground">No description</p>
        )}
        
        {/* Author information */}
        <div className="flex items-center text-sm text-muted-foreground">
          <UserIcon className="h-3 w-3 mr-1" />
          <span>
            {task.author?.name || 'Anonymous'}
          </span>
        </div>
      </CardContent>
      <CardFooter className="pt-0 flex justify-end">
        <Button 
          variant="default"
          size="sm" 
          asChild
        >
          <Link 
            href={`/user/dashboard/client/tasks/${task.id}`}
            aria-label={`See details for ${task.name}`}
          >
            See more <ArrowRight className="ml-1 h-3 w-3" aria-hidden="true" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default TaskCard;
