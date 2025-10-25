/**
 * Jest Setup File
 * 
 * Runs before all tests. Use this for:
 * - Global test configuration
 * - Environment variable setup
 * - Global mocks
 * - Extended matchers
 */

import '@testing-library/jest-dom';
import { config } from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load environment variables for testing
// Try .env.local first, then fall back to .env
const envLocalPath = path.resolve(process.cwd(), '.env.local');
const envPath = path.resolve(process.cwd(), '.env');

if (fs.existsSync(envLocalPath)) {
  config({ path: envLocalPath });
} else if (fs.existsSync(envPath)) {
  config({ path: envPath });
} else {
  console.warn('⚠️  No .env or .env.local file found');
}

// Ensure required environment variables are present
const requiredEnvVars = [
  'MONGODB_URI',
  'GOOGLE_GENERATIVE_AI_API_KEY', // For AI integration tests
];

const missingEnvVars = requiredEnvVars.filter(
  (varName) => !process.env[varName]
);

if (missingEnvVars.length > 0) {
  console.warn(
    `⚠️  Warning: Missing environment variables: ${missingEnvVars.join(', ')}`
  );
  console.warn('   Some tests may fail without these variables.');
}

// Global test timeout (can be overridden per test)
jest.setTimeout(30000);

// Silence console logs during tests (optional - comment out if you want logs)
// global.console = {
//   ...console,
//   log: jest.fn(),
//   debug: jest.fn(),
//   info: jest.fn(),
//   warn: jest.fn(),
//   error: jest.fn(),
// };

