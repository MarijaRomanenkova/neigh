'use client';

/**
 * @module Components/Header
 */

import { Button } from '@/components/ui/button';
import ModeToggle from './mode-toggle';
import Link from 'next/link';
import { EllipsisVertical, ShoppingCart, MessageSquare } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import UserButton from './user-button';
import Search from './search';
import { Badge } from '@/components/ui/badge';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

/**
 * Custom hook for tracking unread messages count with auto-refresh
 * @returns {number} The current count of unread messages
 */
const useUnreadMessages = () => {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { status } = useSession();
  
  useEffect(() => {
    if (status !== 'authenticated') return;
    
    const getUnreadCount = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('/api/messages/unread');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch: ${response.status}`);
        }
        
        const data = await response.json();
        if (typeof data.count === 'number') {
          setCount(data.count);
        } else {
          console.warn('Invalid count received:', data);
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch unread messages'));
        console.error('Failed to fetch unread message count:', err);
      } finally {
        setLoading(false);
      }
    };
    
    getUnreadCount();
    const interval = setInterval(getUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [status]);
  
  return count;
};

/**
 * Responsive navigation menu component with user controls and notifications
 * @returns {JSX.Element} The rendered menu component
 */
const Menu = () => {
  const unreadMessagesCount = useUnreadMessages();
  const hasUnreadMessages = unreadMessagesCount > 0;
  
  return (
    <div className='flex justify-end gap-3'>
      <nav className='hidden md:flex w-full max-w-xs gap-1'>
        <ModeToggle />
        <div className="relative">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/user/dashboard/messages">
              <MessageSquare className="h-5 w-5" />
            </Link>
          </Button>
          {hasUnreadMessages && (
            <Badge 
              className="absolute -top-1 -right-1 px-1.5 h-4 min-w-4 flex items-center justify-center bg-destructive text-destructive-foreground rounded-full text-[10px]"
            >
              {unreadMessagesCount}
            </Badge>
          )}
        </div>
        <UserButton />
      </nav>
      <nav className='md:hidden'>
        <Sheet>
          <SheetTrigger className='align-middle'>
            <EllipsisVertical className="h-5 w-5" />
          </SheetTrigger>
          <SheetContent className='flex flex-col items-start'>
            <div className='mt-10'>
              <Search initialCategories={[]} />
            </div>
            <SheetTitle>Menu</SheetTitle>
            <ModeToggle />
            <Button asChild variant='ghost' className="relative w-full justify-start">
              <Link href='/user/dashboard/messages'>
                <MessageSquare className="h-5 w-5 mr-2" /> 
                Messages
                {hasUnreadMessages && (
                  <Badge 
                    className="ml-2 px-1.5 h-4 min-w-4 flex items-center justify-center bg-destructive text-destructive-foreground rounded-full text-[10px]"
                  >
                    {unreadMessagesCount}
                  </Badge>
                )}
              </Link>
            </Button>
            <Button asChild variant='ghost'>
              <Link href='/cart'>
                <ShoppingCart className="h-5 w-5 mr-2" /> Cart
              </Link>
            </Button>
            <UserButton />
            <SheetDescription></SheetDescription>
          </SheetContent>
        </Sheet>
      </nav>
    </div>
  );
};

export default Menu;
