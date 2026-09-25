import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const apiDirectory = path.resolve(scriptDirectory, '..');
const envPath = path.resolve(apiDirectory, '../../.env.test');

dotenv.config({ path: envPath });

const databaseUrl = process.env.TEST_DATABASE_URL;
const directUrl = process.env.TEST_DIRECT_URL ?? databaseUrl;
if (!databaseUrl || !directUrl) {
  console.error('Missing TEST_DATABASE_URL/TEST_DIRECT_URL in root .env.test');
  process.exit(1);
}

const commandEnvironment = {
  ...process.env,
  NODE_ENV: 'test',
  DATABASE_URL: databaseUrl,
  DIRECT_URL: directUrl,
};

function runNodeScript(scriptPath, args) {
  const result = spawnSync(process.execPath, [scriptPath, ...args], {
    cwd: apiDirectory,
    env: commandEnvironment,
    stdio: 'inherit',
  });
  if (result.error) {
    console.error(`Failed to start ${scriptPath}:`, result.error.message);
    process.exit(1);
  }
  if (result.status !== 0) {
    console.error(`${path.basename(scriptPath)} exited with status ${result.status ?? 'unknown'}`);
    process.exit(result.status ?? 1);
  }
}

const workspaceRoot = path.resolve(apiDirectory, '../..');
const prismaCli = path.join(workspaceRoot, 'node_modules/prisma/build/index.js');
const tsxCli = path.join(workspaceRoot, 'node_modules/tsx/dist/cli.mjs');

console.log('Preparing the explicitly configured integration-test database…');
runNodeScript(prismaCli, ['migrate', 'deploy', '--schema', 'prisma/schema.prisma']);
runNodeScript(tsxCli, ['prisma/seed.ts']);
console.log('Integration-test database is migrated and seeded.');
