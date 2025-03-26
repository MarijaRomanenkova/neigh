'use client';

import { SessionProvider } from 'next-auth/react';
import { useEffect } from 'react';

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
