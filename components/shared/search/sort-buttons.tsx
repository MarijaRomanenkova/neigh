'use client';

import { Button } from '@/components/ui/button';

interface SortButtonsProps {
  currentSort: 'newest' | 'lowest' | 'highest';
  onSortChange: (sort: 'newest' | 'lowest' | 'highest') => void;
}

const sortOrders = ['newest', 'lowest', 'highest'] as const;

export default function SortButtons({ currentSort, onSortChange }: SortButtonsProps) {
  return (
    <div className="flex space-x-2">
      {sortOrders.map((sort) => (
        <Button
          key={sort}
          variant={currentSort === sort ? 'default' : 'outline'}
          size="sm"
          onClick={() => onSortChange(sort)}
        >
          {sort.charAt(0).toUpperCase() + sort.slice(1)}
        </Button>
      ))}
    </div>
  );
} 
