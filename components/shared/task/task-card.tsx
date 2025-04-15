'use client';

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
import { useSession } from 'next-auth/react';
import TaskArchiveButton from './task-archive-button';

/**
 * Task Card Component
 * 
 * Renders a card UI for a task with:
 * - Task name and truncated description
 * - Price display (or "For negotiation" if no price)
 * - Author information
 * - "See more" button linking to task details
 * - Archive button (if user is the task creator)
 * 
 * Uses shadcn/ui Card components for consistent styling.
 * 
 * @param {Object} props - Component properties
 * @param {Task} props.task - Task data to display
 * @returns {JSX.Element} The rendered task card
 */
const TaskCard = ({ task }: { task: Task }) => {
  const { data: session, status } = useSession();
  // Ensure we're comparing by ID (not by name) and handle potential undefined values
  const isOwner = !!session?.user?.id && !!task.author?.id && session.user.id === task.author.id;
  const isAuthenticated = status === 'authenticated';

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
        <div className="space-y-2 min-w-0">
          <Link href={`/user/dashboard/client/tasks/${task.id}`}>
            <h2 className='text-xl font-medium line-clamp-1'>{task.name}</h2>
          </Link>
          <div className="h-[2.5rem]">
            {task.description ? (
              <p className="text-sm text-muted-foreground line-clamp-2 break-words">{task.description}</p>
            ) : (
              <p className="text-sm text-muted-foreground">No description</p>
            )}
          </div>
          
          {/* Author information - only shown to authenticated users */}
          {isAuthenticated && (
            <div className="flex items-center text-sm text-muted-foreground">
              <UserIcon className="h-3 w-3 mr-1 flex-shrink-0" />
              <span className="truncate">
                {task.author?.name || 'Anonymous'}
              </span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="pt-0 flex justify-end gap-2">
        <Button 
          variant="default"
          size="sm" 
          asChild
          className="w-full flex justify-center mt-2 text-sm"
        >
          <Link 
            href={isOwner 
              ? `/user/dashboard/client/tasks/${task.id}/edit` 
              : `/user/dashboard/client/tasks/${task.id}`}
            aria-label={isOwner 
              ? `Edit ${task.name}` 
              : `See details for ${task.name}`}
          >
            {isOwner ? 'Edit' : 'See more'} <ArrowRight className="ml-1 h-3 w-3" aria-hidden="true" />
          </Link>
        </Button>
        {isAuthenticated && isOwner && !task.isArchived && (
          <TaskArchiveButton taskId={task.id} />
        )}
      </CardFooter>
    </Card>
  );
};

export default TaskCard;
