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

import TaskCard from '@/components/shared/task/task-card';
import { Button } from '@/components/ui/button';
import { getAllTasks, getAllCategories } from '@/lib/actions/task.actions';
import Link from 'next/link';
import { Suspense } from 'react';
import { Task } from '@/types';

// Force dynamic rendering to avoid build-time database access
export const dynamic = 'force-dynamic';

/**
 * Available price range filters for tasks
 */
const prices = [
  { name: '$1 to $50', value: '1-50' },
  { name: '$51 to $100', value: '51-100' },
  { name: '$101 to $200', value: '101-200' },
  { name: '$201 to $500', value: '201-500' },
  { name: '$501 to $1000', value: '501-1000' },
];

/**
 * Available sort order options for search results
 */
const sortOrders = ['newest', 'lowest', 'highest'];

// Loading component for search results
function SearchResultsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="space-y-4">
          <div className="h-[200px] w-full bg-muted animate-pulse rounded-lg" />
          <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
          <div className="h-4 w-1/2 bg-muted animate-pulse rounded" />
        </div>
      ))}
    </div>
  );
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: {
    q?: string;
    category?: string;
    price?: string;
    sort?: string;
    page?: string;
  };
}) {
  const {
    q = 'all',
    category = 'all',
    price = 'all',
    sort = 'newest',
    page = '1',
  } = searchParams;

  // Validate sort parameter
  const validSort = (['newest', 'lowest', 'highest'].includes(sort) ? sort : 'newest') as 'newest' | 'lowest' | 'highest';

  /**
   * Generates a filter URL with updated parameters
   */
  const getFilterUrl = ({
    c,
    p,
    s,
    pg,
  }: {
    c?: string;
    p?: string;
    s?: 'newest' | 'lowest' | 'highest';
    pg?: string;
  }) => {
    const params: Record<string, string> = { 
      q, 
      category, 
      price, 
      sort: validSort, 
      page 
    };
    if (c) params.category = c;
    if (p) params.price = p;
    if (s) params.sort = s;
    if (pg) params.page = pg;
    return `/search?${new URLSearchParams(params).toString()}`;
  };

  // Fetch categories and tasks with loading states
  const [categories, tasksResult] = await Promise.all([
    getAllCategories(),
    getAllTasks({
      query: q !== 'all' ? q : undefined,
      category: category !== 'all' ? category : undefined,
      price: price !== 'all' ? price : undefined,
      sort: validSort,
      page: Number(page),
    }),
  ]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Filter Sidebar */}
        <div className="md:col-span-1">
          <div className="space-y-6">
            {/* Categories */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Categories</h3>
              <div className="space-y-2">
                <Link
                  href={getFilterUrl({ c: 'all' })}
                  className={`block px-4 py-2 rounded-lg ${
                    category === 'all'
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted'
                  }`}
                >
                  All Categories
                </Link>
                {categories.map((cat) => (
                  <Link
                    key={cat.id}
                    href={getFilterUrl({ c: cat.id })}
                    className={`block px-4 py-2 rounded-lg ${
                      category === cat.id
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted'
                    }`}
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* Price Ranges */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Price Range</h3>
              <div className="space-y-2">
                <Link
                  href={getFilterUrl({ p: 'all' })}
                  className={`block px-4 py-2 rounded-lg ${
                    price === 'all'
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted'
                  }`}
                >
                  All Prices
                </Link>
                {prices.map((p) => (
                  <Link
                    key={p.value}
                    href={getFilterUrl({ p: p.value })}
                    className={`block px-4 py-2 rounded-lg ${
                      price === p.value
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted'
                    }`}
                  >
                    {p.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
          
        {/* Search Results */}
        <div className="md:col-span-3">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">
              {q !== 'all' ? `Search Results for "${q}"` : 'All Tasks'}
            </h2>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-muted-foreground">Sort by:</span>
              <div className="flex space-x-2">
                {sortOrders.map((s) => (
                  <Button
                    key={s}
                    variant={sort === s ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      window.location.href = getFilterUrl({ s: s as 'newest' | 'lowest' | 'highest' });
                    }}
                  >
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <Suspense fallback={<SearchResultsSkeleton />}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tasksResult.data.map((task: Task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          </Suspense>
        </div>
      </div>
    </div>
  );
}
