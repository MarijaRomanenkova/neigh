'use client';

import { useRouter, useSearchParams } from 'next/navigation';

export type SortType = 'newest' | 'lowest' | 'highest';

interface SearchFilters {
  q: string;
  category: string;
  price: string;
  sort: SortType;
  page: number;
}

export function useSearchFilters() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const q = searchParams.get('q') || 'all';
  const category = searchParams.get('category') || 'all';
  const price = searchParams.get('price') || 'all';
  const sort = searchParams.get('sort') || 'newest';
  const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1;

  const validSort = ['newest', 'lowest', 'highest'].includes(sort) 
    ? sort as SortType
    : 'newest';

  const updateFilters = (newFilters: Partial<SearchFilters>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value) {
        params.set(key, value.toString());
      } else {
        params.delete(key);
      }
    });
    router.push(`/search?${params.toString()}`);
  };

  return {
    filters: { 
      q, 
      category, 
      price, 
      sort: validSort, 
      page 
    },
    updateFilters
  };
} 
