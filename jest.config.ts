import type { Config } from 'jest';
import { pathsToModuleNameMapper } from 'ts-jest';
import { compilerOptions } from './tsconfig.json';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  
  // Module path mapping from tsconfig paths
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, {
    prefix: '<rootDir>/',
  }),
  
  // Test match patterns
  testMatch: [
    '**/tests/**/*.test.ts',
    '**/tests/**/*.test.tsx',
  ],
  
  // Coverage configuration
  collectCoverageFrom: [
    'modules/**/*.ts',
    'shared/**/*.ts',
    'app/api/**/*.ts',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/tests/**',
  ],
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  
  // Transform configuration
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        jsx: 'react',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
      },
    }],
  },
  
  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  
  // Global timeout (can be overridden per test)
  testTimeout: 30000,
  
  // Verbose output
  verbose: true,
  
  // Clear mocks between tests
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  
  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/.next/',
    '/dist/',
  ],
  
  // Module directories
  moduleDirectories: ['node_modules', '<rootDir>'],
};

export default config;

