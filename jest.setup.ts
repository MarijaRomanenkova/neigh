// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

// Add Jest DOM matchers
import '@testing-library/jest-dom';
import { TextDecoder, TextEncoder } from 'util';
import { fetch, Headers, Request, Response } from 'cross-fetch';

// Polyfill for TextEncoder and TextDecoder
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as any;

// Polyfill for fetch API
global.fetch = fetch;
global.Headers = Headers;
global.Request = Request;
global.Response = Response;

// Mock ResizeObserver which isn't available in jsdom
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

global.ResizeObserver = ResizeObserverMock;

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(callback => {
  return {
    root: null,
    rootMargin: '',
    thresholds: [],
    disconnect: jest.fn(),
    observe: jest.fn(),
    takeRecords: jest.fn().mockReturnValue([]),
    unobserve: jest.fn(),
  };
});

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn().mockReturnValue({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    pathname: '/',
    query: {},
  }),
  usePathname: jest.fn().mockReturnValue('/'),
  useSearchParams: jest.fn().mockReturnValue({
    get: jest.fn().mockImplementation(key => null),
  }),
}));

// Mock next-auth
jest.mock('next-auth/react', () => ({
  useSession: jest.fn().mockReturnValue({
    data: { user: { id: 'test-user', name: 'Test User', email: 'test@example.com' } },
    status: 'authenticated',
  }),
  signIn: jest.fn().mockResolvedValue({ ok: true, error: null }),
  signOut: jest.fn().mockResolvedValue(true),
}));

// Mock server actions
jest.mock('@/lib/actions/user.actions', () => ({
  signUpUser: jest.fn().mockResolvedValue({ success: true }),
  signInWithCredentials: jest.fn().mockResolvedValue({ success: true }),
  signOutUser: jest.fn().mockResolvedValue({}),
  updateProfile: jest.fn().mockResolvedValue({ success: true }),
  verifyEmail: jest.fn().mockResolvedValue({ success: true }),
  resetPassword: jest.fn().mockResolvedValue({ success: true }),
}));

jest.mock('@/lib/actions/invoice.actions', () => ({
  calculateInvoiceTotal: jest.fn().mockResolvedValue({ total: 100 }),
  createInvoice: jest.fn().mockResolvedValue({ id: 'mock-invoice-id' }),
}));
