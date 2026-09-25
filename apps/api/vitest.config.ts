import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/*.test.ts'],
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/dhaka_tesla_test',
      DIRECT_URL: 'postgresql://postgres:postgres@localhost:5432/dhaka_tesla_test',
      JWT_SECRET: 'test-only-jwt-secret-with-adequate-length',
      WEB_ORIGIN: 'http://localhost:3000',
      LOG_LEVEL: 'silent',
    },
  },
});
