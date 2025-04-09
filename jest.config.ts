import type { Config } from 'jest';
import nextJest from 'next/jest';

// Create Next.js jest configuration
const createJestConfig = nextJest({
  dir: './', // Path to your Next.js app
});

// Base Jest configuration
const customConfig: Config = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  clearMocks: true,
  collectCoverage: false,
  coverageProvider: 'v8',
  testPathIgnorePatterns: ['/node_modules/', '/.next/'],
  transformIgnorePatterns: [
    '/node_modules/(?!query-string|next-auth)',
  ],
};

// Create the final configuration with Next.js
export default createJestConfig(customConfig);
