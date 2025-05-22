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

interface SearchPageProps {
  searchParams: {
    q?: string;
    category?: string;
    price?: string;
    sort?: string;
    page?: string;
  };
}

export default async function SearchPage({
  searchParams,
}: SearchPageProps) {
  const q = searchParams.q || 'all';
  const category = searchParams.category || 'all';
  const price = searchParams.price || 'all';
  const sort = searchParams.sort || 'newest';
  const page = searchParams.page ? parseInt(searchParams.page) : 1;

  const validSort = ['newest', 'lowest', 'highest'].includes(sort) 
    ? sort as 'newest' | 'lowest' | 'highest'
    : 'newest';

  // Fetch tasks with loading states
  const tasks = await getAllTasks({
    query: q,
    category,
    price,
    sort: validSort,
    page,
  });

  return <SearchWrapper initialTasks={tasks} />;
}
