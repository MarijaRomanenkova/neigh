/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  pages: {
    signIn: '/sign-in',
  },
  callbacks: {
    // Empty callbacks object
  },
  providers: [], // Required by NextAuthConfig type
} satisfies NextAuthConfig;
