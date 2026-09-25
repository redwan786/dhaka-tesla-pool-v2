import path from 'node:path';
import dotenv from 'dotenv';
import { defineConfig } from 'vitest/config';

// Integration tests are destructive only to records prefixed with "itest-".
// Requiring an explicit URL prevents an accidental run against a database
// merely because DATABASE_URL happens to exist in the developer shell.
dotenv.config({ path: path.resolve(process.cwd(), '../../.env.test') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.test') });

const databaseUrl = process.env.TEST_DATABASE_URL;
const directUrl = process.env.TEST_DIRECT_URL ?? databaseUrl;

if (!databaseUrl || !directUrl) {
  throw new Error(
    'Integration tests require TEST_DATABASE_URL and TEST_DIRECT_URL in root .env.test',
  );
}

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/integration/**/*.integration.test.ts'],
    fileParallelism: false,
    // Remote Supabase round-trips are slower than local PostgreSQL, especially
    // for the intentionally multi-request lifecycle and concurrency scenarios.
    testTimeout: 90_000,
    hookTimeout: 90_000,
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: databaseUrl,
      DIRECT_URL: directUrl,
      JWT_SECRET: 'integration-test-jwt-secret-with-adequate-length',
      WEB_ORIGIN: 'http://localhost:3000',
      LOG_LEVEL: 'silent',
    },
  },
});
