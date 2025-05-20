'use client';

/**
 * Task Card Component
 * @module Components
 * @group Shared/Tasks
 * 
 * A client-side component that renders a card displaying task information in a compact format.
 * Features include:
 * - Task name and truncated description
 * - Price display (or "For negotiation" if no price)
 * - Author information with rating
 * - Image display with fallback
 * - Action buttons (edit/contact) based on user role
 * - Archive functionality for task owners
 * 
 * @example
 * ```tsx
 * <TaskCard
 *   task={{
 *     id: "task123",
 *     name: "Garden Maintenance",
 *     description: "Weekly garden maintenance required",
 *     price: 100,
 *     images: ["image1.jpg"],
 *     author: {
 *       name: "John Doe",
 *       clientRating: 4.5
 *     }
 *   }}
 * />
 * ```
 */

import Image from 'next/image';
import Link from 'next/link';
import TaskPrice from './task-price';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardFooter, CardTitle, CardDescription } from '@/components/ui/card';
import { Task } from '@/types';
import { UserIcon, ArrowRight, Pencil, MoveRight } from 'lucide-react';
import { useSession } from 'next-auth/react';
import TaskArchiveButton from './task-archive-button';
import UserRatingDisplay from '../ratings/user-rating-display';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { useState, useEffect } from 'react';

/**
 * Task Card Component
 * 
 * Renders a card UI for a task with:
 * - Task name and truncated description
 * - Price display (or "For negotiation" if no price)
 * - Author information with rating
 * - Image display with fallback
 * - Action buttons (edit/contact) based on user role
 * - Archive functionality for task owners
 * 
 * Uses shadcn/ui Card components for consistent styling.
 * 
 * @param {Object} props - Component properties
 * @param {Task} props.task - Task data to display
 * @returns {JSX.Element} The rendered task card
 */
const TaskCard = ({ task }: { task: Task }) => {
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);
  const isAuthenticated = session?.user;
  const isOwner = task.author?.id === session?.user?.id;

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Card className="h-[200px] animate-pulse bg-muted" />
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="line-clamp-1">{task.name}</CardTitle>
          <Badge variant="outline" className="whitespace-nowrap">
            {formatCurrency(task.price)}
          </Badge>
        </div>
        <CardDescription className="line-clamp-2">
          {task.description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Category: {task.category?.name || 'Uncategorized'}</span>
        </div>
      </CardContent>
      <CardFooter>
        <div className="flex gap-2">
          {isAuthenticated && isOwner && !task.isArchived && (
            <TaskArchiveButton taskId={task.id} />
          )}
          <Button 
            variant={isOwner ? "success-outline" : "success"}
            size="sm" 
            asChild
            className="whitespace-nowrap flex items-center"
          >
            <Link 
              href={isOwner 
                ? `/user/dashboard/client/tasks/${task.id}/edit` 
                : `/user/dashboard/client/tasks/${task.id}`}
              aria-label={isOwner 
                ? `Edit ${task.name}` 
                : `See details for ${task.name}`}
            >
              {isOwner ? (
                <>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </>
              ) : (
                <>
                  View <ArrowRight className="ml-1 h-4 w-4" aria-hidden="true" />
                </>
              )}
            </Link>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default TaskCard;
