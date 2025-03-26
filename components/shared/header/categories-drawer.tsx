'use client';

import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { MenuIcon } from 'lucide-react';
import Link from 'next/link';
import { Category } from '@/types';
import { useState, useEffect } from 'react';

interface CategoriesDrawerProps {
  initialCategories?: Category[];
}

const CategoriesDrawer = ({ initialCategories = [] }: CategoriesDrawerProps) => {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [isLoading, setIsLoading] = useState(initialCategories.length === 0);
  const [isClient, setIsClient] = useState(false);

  // Set client-side rendering flag
  useEffect(() => {
    setIsClient(true);
    
    // Force hydration with the initialCategories
    if (initialCategories.length > 0) {
      setCategories(initialCategories);
      setIsLoading(false);
    }
  }, [initialCategories]);

  useEffect(() => {
    if (isClient && initialCategories.length === 0) {
      const fetchCategories = async () => {
        try {
          setIsLoading(true);
          console.log("Fetching categories from API");
          const response = await fetch('/api/categories');
          
          if (!response.ok) {
            throw new Error(`API error with status ${response.status}`);
          }
          
          const data = await response.json();
          console.log("Categories fetched:", data);
          setCategories(data);
        } catch (error) {
          console.error('Error fetching categories:', error);
        } finally {
          setIsLoading(false);
        }
      };

      fetchCategories();
    }
  }, [isClient, initialCategories]);

  // Don't render until client-side hydration is complete
  if (!isClient) {
    return null;
  }

  return (
    <Drawer direction='left'>
      <DrawerTrigger asChild>
        <Button variant='ghost' size="sm" className="px-2">
          <MenuIcon className="h-6 w-6" />
        </Button>
      </DrawerTrigger>
      <DrawerContent className='h-full max-w-xs'>
        <DrawerHeader>
          <DrawerTitle className="text-center">Categories</DrawerTitle>
          <div className='pt-4 space-y-1'>
            {isLoading ? (
              <div className="text-center py-4">Loading categories...</div>
            ) : categories.length === 0 ? (
              <div className="text-center py-4">No categories found</div>
            ) : (
              categories.map((category: Category) => (
                <Button
                  className='w-full justify-start text-base py-3'
                  variant='ghost'
                  key={category.id}
                  asChild
                >
                  <DrawerClose asChild>
                    <Link href={`/search?category=${category.name}`}>
                      {category.name} {category._count?.tasks !== undefined && `(${category._count.tasks})`}
                    </Link>
                  </DrawerClose>
                </Button>
              ))
            )}
          </div>
        </DrawerHeader>
      </DrawerContent>
    </Drawer>
  );
};

export default CategoriesDrawer;
