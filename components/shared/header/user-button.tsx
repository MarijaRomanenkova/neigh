'use client';
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

const UserButton = () => {
  const { data: session, status } = useSession();
  const [isClient, setIsClient] = useState(false);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  
  // Set client-side rendering flag and handle loading timeout
  useEffect(() => {
    setIsClient(true);
    
    // If loading takes more than 3 seconds, show the sign-in button anyway
    const timer = setTimeout(() => {
      if (status === 'loading') {
        console.log("Session loading timeout reached, showing fallback UI");
        setLoadingTimeout(true);
      }
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [status]);
  
  // Log the session status to help debug
  useEffect(() => {
    console.log("Auth status:", status, session ? "User found" : "No user");
  }, [status, session]);
  
  // Don't render anything until client-side hydration is complete
  if (!isClient) {
    return null;
  }
  
  // Show fallback UI if loading takes too long
  if (status === 'loading' && !loadingTimeout) {
    return (
      <Button variant="ghost" size="sm" className="opacity-70">
        <UserIcon className="h-5 w-5 mr-2" />
        <span>Loading...</span>
      </Button>
    );
  }

  // If we have a session or loading timed out but we're authenticated
  if (session) {
    const firstInitial = session.user?.name?.charAt(0)?.toUpperCase() ?? 'U';
    const isAdmin = session?.user?.role === 'admin';
    
    const handleSignOut = async () => {
      try {
        await signOut({ callbackUrl: '/' });
      } catch (error) {
        console.error('Error signing out:', error);
      }
    };

    return (
      <div className='flex gap-2 items-center'>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant='ghost'
              size="sm"
              className='relative w-10 h-10 rounded-full flex items-center justify-center bg-gray-200'
            >
              {firstInitial}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className='w-56' align='end'>
            <DropdownMenuLabel className='font-normal'>
              <div className='flex flex-col space-y-1'>
                <div className='text-sm font-medium leading-none'>
                  {session.user?.name}
                </div>
                <div className='text-sm text-muted-foreground leading-none'>
                  {session.user?.email}
                </div>
                {isAdmin && (
                  <div className='text-xs text-primary mt-1'>
                    Administrator
                  </div>
                )}
              </div>
            </DropdownMenuLabel>

            <DropdownMenuItem asChild>
              <Link href='/user/profile' className='w-full cursor-pointer'>
                <UserIcon className="h-5 w-5 mr-2" />
                User Profile
              </Link>
            </DropdownMenuItem>
            
            {/* Admin users see the admin dashboard */}
            {isAdmin && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href='/admin/overview' className='w-full cursor-pointer'>
                    <ShieldCheck className="h-5 w-5 mr-2" />
                    Admin Dashboard
                  </Link>
                </DropdownMenuItem>
              </>
            )}
            
            <DropdownMenuSeparator />

            <DropdownMenuItem onSelect={handleSignOut}>
              <LogOut className="h-5 w-5 mr-2" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }
  
  // Otherwise show sign in button
  return (
    <Button size="sm" asChild>
      <Link href='/sign-in'>
        <UserIcon className="h-5 w-5 mr-2" /> Sign In
      </Link>
    </Button>
  );
};

export default UserButton;
