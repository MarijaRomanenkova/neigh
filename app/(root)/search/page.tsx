/**
 * Search Page Component
 * @module Pages
 * @group Search
 * 
 * This page provides advanced task search functionality with filtering options by:
 * - Query text
 * - Category
 * - Price range
 * - Sort order
 * 
 * It also supports pagination and displays search results in a grid layout.
 */

import { getAllTasks } from '@/lib/actions/task.actions';
import SearchWrapper from '@/components/shared/search/search-wrapper';

// Force dynamic rendering to avoid build-time database access
export const dynamic = 'force-dynamic';

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    category?: string;
    price?: string;
    sort?: string;
    page?: string;
  }>;
}) {
  const {
    q = 'all',
    category = 'all',
    price = 'all',
    sort = 'newest',
    page = '1',
  } = await searchParams;

  const validSort = ['newest', 'lowest', 'highest'].includes(sort) 
    ? sort as 'newest' | 'lowest' | 'highest'
    : 'newest';

  // Fetch tasks with loading states
  const tasks = await getAllTasks({
    query: q,
    category,
    price,
    sort: validSort,
    page: Number(page),
  });

  return <SearchWrapper initialTasks={tasks} />;
}
