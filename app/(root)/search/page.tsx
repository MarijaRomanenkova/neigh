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
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const q = typeof searchParams.q === 'string' ? searchParams.q : 'all';
  const category = typeof searchParams.category === 'string' ? searchParams.category : 'all';
  const price = typeof searchParams.price === 'string' ? searchParams.price : 'all';
  const sort = typeof searchParams.sort === 'string' ? searchParams.sort : 'newest';
  const page = typeof searchParams.page === 'string' ? parseInt(searchParams.page) : 1;

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
