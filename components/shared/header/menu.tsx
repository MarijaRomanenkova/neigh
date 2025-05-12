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
import { useSocket } from '@/components/providers/socket-provider';

/**
 * Fetches the count of unread messages for the current user
 */
async function fetchUnreadCount(userId: string) {
  try {
    const response = await fetch('/api/messages/unread', {
      cache: 'no-store',
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status}`);
    }
    
    const data = await response.json();
    return typeof data.count === 'number' ? data.count : 0;
  } catch (err) {
    console.error('Error fetching unread count:', err);
    return 0;
  }
}

/**
 * Responsive navigation menu component with user controls and notifications
 * @returns {JSX.Element} The rendered menu component
 */
const Menu = () => {
  const { data: session, status } = useSession();
  const { unreadCount, resetUnreadCount } = useSocket();
  const [initialCount, setInitialCount] = useState<number>(0);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (status !== 'authenticated' || !session?.user?.id) {
      return;
    }

    const fetchCount = async () => {
      try {
        setError(null);
        const count = await fetchUnreadCount(session.user.id);
        console.log('Fetched initial unread count:', count);
        setInitialCount(count);
      } catch (err) {
        console.error('Error in fetchCount:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch unread messages'));
      }
    };

    // Initial fetch
    fetchCount();
  }, [session, session?.user?.id, status]);

  const totalUnreadCount = initialCount + unreadCount;
  console.log('Current unread counts:', { initialCount, unreadCount, totalUnreadCount });
  const hasUnreadMessages = totalUnreadCount > 0;

  // Reset unread count when clicking on messages link
  const handleMessagesClick = () => {
    resetUnreadCount();
  };
  
  return (
    <div className='flex justify-end gap-3'>
      <nav className='hidden md:flex w-full max-w-xs gap-1'>
        <ModeToggle />
        <div className="relative">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/user/dashboard/messages" onClick={handleMessagesClick}>
              <MessageSquare className="h-5 w-5" />
            </Link>
          </Button>
          {hasUnreadMessages && (
            <Badge 
              className="absolute -top-1 -right-1 px-1.5 h-4 min-w-4 flex items-center justify-center bg-destructive text-destructive-foreground rounded-full text-[10px]"
            >
              {totalUnreadCount}
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
              <Link href='/user/dashboard/messages' onClick={handleMessagesClick}>
                <MessageSquare className="h-5 w-5 mr-2" /> 
                Messages
                {hasUnreadMessages && (
                  <Badge 
                    className="ml-2 px-1.5 h-4 min-w-4 flex items-center justify-center bg-destructive text-destructive-foreground rounded-full text-[10px]"
                  >
                    {totalUnreadCount}
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
