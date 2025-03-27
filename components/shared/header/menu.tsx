'use client';

/**
 * Header Menu Component
 * @module Components
 * @group Shared/Header
 * 
 * This client-side component renders the main navigation menu with responsive
 * desktop and mobile layouts, user authentication controls, and notification badges.
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
 * Custom hook for fetching and tracking unread message count
 * 
 * Provides real-time tracking of unread messages with:
 * - Initial loading on component mount
 * - Periodic polling for updates
 * - Error handling and retry logic
 * 
 * @returns {number} Count of unread messages
 */
const useUnreadMessages = () => {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { status } = useSession();
  
  useEffect(() => {
    // Only fetch messages if the user is authenticated
    if (status !== 'authenticated') return;
    
    /**
     * Fetches the current unread message count from the API
     */
    const getUnreadCount = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('/api/messages/unread');
        
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }
        
        const data = await response.json();
        setCount(data.count);
      } catch (err) {
        console.error('Failed to fetch unread message count:', err);
        setError('Failed to fetch unread messages');
        // Keep the old count if there's an error
      } finally {
        setLoading(false);
      }
    };
    
    // Fetch immediately
    getUnreadCount();
    
    // Set up polling interval
    const interval = setInterval(getUnreadCount, 30000); // Poll every 30 seconds
    
    // Clean up interval on unmount
    return () => clearInterval(interval);
  }, [status]);
  
  return count;
};

/**
 * Menu Component
 * 
 * Renders a responsive navigation menu with:
 * - Dark/light mode toggle
 * - Messages link with unread count badge
 * - User authentication button
 * - Shopping cart link
 * - Mobile slide-out menu for smaller screens
 * 
 * Automatically adapts layout based on screen size.
 * 
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
