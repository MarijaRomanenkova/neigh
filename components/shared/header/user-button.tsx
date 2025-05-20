'use client';

/**
 * User Button Component
 * @module Components
 * @group Shared/Header
 * 
 * This client-side component provides user authentication controls
 * with dropdown menu for account actions and profile information.
 */

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { UserIcon, LogOut, ShieldCheck } from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';

/**
 * User Button Component
 * 
 * Renders authentication controls with:
 * - User avatar with initials as trigger
 * - Profile information display 
 * - Sign out functionality
 * - Admin-specific navigation options
 * - Different states for authenticated/unauthenticated users
 * - Loading state with fallback handling
 * 
 * Manages session state and hydration with next-auth.
 * 
 * @returns {JSX.Element|null} The rendered user button or null during hydration
 */
export default function UserButton() {
  const { data: session, status } = useSession();
  const [mounted, setMounted] = useState(false);
  
  // Set mounted state after hydration
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Don't render anything until client-side hydration is complete
  if (!mounted) {
    return (
      <Button variant="ghost" size="sm" className="focus-visible:ring-0 focus-visible:ring-offset-0">
        <UserIcon className="h-5 w-5" />
      </Button>
    );
  }
  
  // Show loading state
  if (status === 'loading') {
    return (
      <Button variant="ghost" size="sm" className="focus-visible:ring-0 focus-visible:ring-offset-0">
        <UserIcon className="h-5 w-5" />
      </Button>
    );
  }
  
  // Show sign in button if not authenticated
  if (!session?.user) {
    return (
      <Link href="/sign-in">
        <Button variant="ghost" size="sm" className="focus-visible:ring-0 focus-visible:ring-offset-0">
          <UserIcon className="h-5 w-5" />
        </Button>
      </Link>
    );
  }
  
  // Show user menu if authenticated
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="focus-visible:ring-0 focus-visible:ring-offset-0">
          <UserIcon className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/user/dashboard">Dashboard</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/user/profile">Profile</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/api/auth/signout">Sign Out</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
