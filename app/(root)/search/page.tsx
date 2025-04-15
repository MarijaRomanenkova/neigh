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

/**
 * Generates metadata for the search page based on search parameters
 * 
 * Creates dynamic page titles that reflect the current search filters,
 * improving SEO and user experience.
 * 
 * @param {Object} props - Component props
 * @param {Promise<{q: string, category: string, price: string}>} props.searchParams - Search parameters
 * @returns {Object} Metadata object with title
 */
export async function generateMetadata(props: {
  searchParams: Promise<{
    q: string;
    category: string;
    price: string;
  }>;
}) {
  const {
    q = 'all',
    category = 'all',
    price = 'all',
  } = await props.searchParams;

  const isQuerySet = q && q !== 'all' && q.trim() !== '';
  const isCategorySet = category && category !== 'all' && category.trim() !== '';
  const isPriceSet = price && price !== 'all' && price.trim() !== '';

  if (isQuerySet || isCategorySet || isPriceSet) {
    return {
      title: `Search ${isQuerySet ? q : ''} 
      ${isCategorySet ? `: Category ${category}` : ''}
      ${isPriceSet ? `: Price ${price}` : ''}`
    };
  }
  
  return {
    title: 'Search tasks',
  };
}

/**
 * Search Page Component
 * 
 * This server component renders the task search interface with:
 * - Filter sidebar for categories and price ranges
 * - Dynamic search results based on filters
 * - Sort options for results
 * - Clear filters option
 * 
 * @component
 * @param {Object} props - Component props
 * @param {Promise<{q?: string, category?: string, price?: string, sort?: string, page?: string}>} props.searchParams - Search parameters
 * @returns {JSX.Element} Search page with filters and results
 */
const SearchPage = async (props: {
  searchParams: Promise<{
    q?: string;
    category?: string;
    price?: string;
    sort?: 'newest' | 'lowest' | 'highest';
    page?: string;
  }>;
}) => {
  const {
    q = 'all',
    category = 'all',
    price = 'all',
    sort = 'newest',
    page = '1',
  } = await props.searchParams;

  // Validate sort parameter
  const validSort = ['newest', 'lowest', 'highest'].includes(sort) ? sort : 'newest';

  /**
   * Generates a filter URL with updated parameters
   * 
   * Creates a URL string for filter links that preserves existing
   * parameters while updating the specified ones.
   * 
   * @param {Object} options - Filter options to update
   * @param {string} [options.c] - Category filter
   * @param {string} [options.p] - Price filter
   * @param {string} [options.s] - Sort order
   * @param {string} [options.pg] - Page number
   * @returns {string} URL with updated parameters
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
    const params = { 
      q, 
      category, 
      price, 
      sort: sort as 'newest' | 'lowest' | 'highest', 
      page 
    };
    if (c) params.category = c;
    if (p) params.price = p;
    if (s) params.sort = s;
    if (pg) params.page = pg;
    return `/search?${new URLSearchParams(params).toString()}`;
  };

  // Fetch tasks and categories in parallel for better performance
  const [tasks, categories] = await Promise.all([
    getAllTasks({
      query: q,
      category,
      price,
      sort: validSort,
      page: Number(page),
    }),
    getAllCategories()
  ]);

  return (
    <div className='grid md:grid-cols-5 md:gap-5'>
      {/* Filter sidebar */}
      <div className='filter-links'>
        {/* Category Links */}
        <div className='text-lg text-muted-foreground mb-2 mt-3'>Category</div>
        <ul className='space-y-1'>
          <li>
            <Link
              className={`${(category === 'all' || category === '') && 'font-bold'}`}
              href={getFilterUrl({ c: 'all' })}
            >
              All
            </Link>
          </li>
          {categories.map((c) => (
            <li key={c.name}>
              <Link
                className={`${c.name === category && 'font-bold'}`}
                href={getFilterUrl({ c: c.name })}
              >
                {c.name}
              </Link>
            </li>
          ))}
        </ul>

        {/* Price Links */}
        <div className='text-lg text-muted-foreground mb-2 mt-8'>Pay</div>
        <ul className='space-y-1'>
          <li>
            <Link
              className={`${price === 'all' && 'font-bold'}`}
              href={getFilterUrl({ p: 'all' })}
            >
              Any
            </Link>
          </li>
          {prices.map((p) => (
            <li key={p.value}>
              <Link
                className={`${price === p.value && 'font-bold'}`}
                href={getFilterUrl({ p: p.value })}
              >
                {p.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* Search results and controls */}
      <div className='md:col-span-4 space-y-4'>
        <div className='flex-between flex-col md:flex-row my-4'>
          {/* Active filters display and clear button */}
          <div className='flex items-center'>
            {q !== 'all' && q !== '' && 'Query: ' + q}
            {category !== 'all' && category !== '' && 'Category: ' + category}
            {price !== 'all' && ' Price: ' + price}
            &nbsp;
            {(q !== 'all' && q !== '') ||
            (category !== 'all' && category !== '') ||
            price !== 'all' ? (
              <Button variant={'link'} asChild>
                <Link href='/search'>Clear</Link>
              </Button>
            ) : null}
          </div>
          
          {/* Sort options */}
          <div>
            Sort by{' '}
            {sortOrders.map((s) => (
              <Link
                key={s}
                className={`mx-2 ${sort == s && 'font-bold'}`}
                href={getFilterUrl({ s: s as 'newest' | 'lowest' | 'highest' })}
              >
                {s}
              </Link>
            ))}
          </div>
        </div>

        {/* Task grid */}
        <div className='grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3'>
          {tasks.data.length === 0 && <div>No tasks found</div>}
          {tasks.data.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default SearchPage;
