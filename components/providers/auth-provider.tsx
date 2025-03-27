'use client';

/**
 * Authentication Provider Component
 * @module Components/Providers
 * 
 * This component wraps the application with Next-Auth's SessionProvider
 * to enable authentication functionality throughout the app.
 */

import { SessionProvider } from 'next-auth/react';
import { useEffect } from 'react';

/**
 * AuthProvider Component
 * 
 * Wraps child components with Next-Auth's SessionProvider to enable:
 * - Access to authentication state throughout the app
 * - Session management and persistence
 * - Authentication-related hooks and utilities
 * 
 * @param {Object} props - Component properties
 * @param {React.ReactNode} props.children - Child components to be wrapped
 * @returns {JSX.Element} The SessionProvider with children
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Log when the auth provider is initialized
  useEffect(() => {
    console.log("Auth provider initialized");
  }, []);

  return (
    <SessionProvider>
      {children}
    </SessionProvider>
  );
} 
