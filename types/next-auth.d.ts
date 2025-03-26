import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  export interface Session {
    user: {
      id: string;
      role: string;
      fullName?: string | null;
      phoneNumber?: string | null;
      companyId?: string | null;
      address?: Record<string, unknown> | string | null;
    } & DefaultSession['user'];
  }
}
