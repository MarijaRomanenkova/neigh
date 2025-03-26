'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SearchIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

type SearchCategory = {
  id: string;
  name: string;
};

interface SearchProps {
  initialCategories: SearchCategory[];
}

const Search = ({ initialCategories }: SearchProps) => {
  const [categories, setCategories] = useState<SearchCategory[]>(initialCategories);

  return (
    <form action='/search' method='GET'>
      <div className='flex w-full max-w-sm items-center space-x-2'>
        <Select name='category' defaultValue="all">
          <SelectTrigger className='w-[180px] h-10'>
            <SelectValue placeholder='All' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All</SelectItem>
            {categories.map((category: SearchCategory) => (
              <SelectItem key={category.id} value={category.name}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          name='q'
          type='text'
          placeholder='Search...'
          className='md:w-[100px] lg:w-[300px] h-10'
        />
        <Button size="sm">
          <SearchIcon className="h-5 w-5" />
        </Button>
      </div>
    </form>
  );
};

export default Search;
