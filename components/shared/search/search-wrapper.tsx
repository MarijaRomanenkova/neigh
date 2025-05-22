'use client';

import { useSearchFilters } from '@/hooks/use-search-filters';
import SortWrapper from './sort-wrapper';
import { Task } from '@/types';
import TaskCard from '../task/task-card';
import { Suspense } from 'react';
import SearchResultsSkeleton from './search-results-skeleton'

interface SearchWrapperProps {
  initialTasks: {
    data: Task[];
    totalPages: number;
  };
}

export default function SearchWrapper({ initialTasks }: SearchWrapperProps) {
  const { filters } = useSearchFilters();
  const { q } = filters;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">
          {q !== 'all' ? `Search Results for "${q}"` : 'All Tasks'}
        </h2>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-muted-foreground">Sort by:</span>
          <SortWrapper currentSort={filters.sort} />
        </div>
      </div>

      <Suspense fallback={<SearchResultsSkeleton />}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {initialTasks.data.map((task: Task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      </Suspense>
    </div>
  );
} 
