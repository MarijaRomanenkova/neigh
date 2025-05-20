'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import SortButtons from './sort-buttons';

interface SortWrapperProps {
  currentSort: 'newest' | 'lowest' | 'highest';
}

export default function SortWrapper({ currentSort }: SortWrapperProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSortChange = (sort: 'newest' | 'lowest' | 'highest') => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('sort', sort);
    router.push(`/search?${params.toString()}`);
  };

  return (
    <SortButtons 
      currentSort={currentSort} 
      onSortChange={handleSortChange} 
    />
  );
} 
