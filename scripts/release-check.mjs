import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

const failures = [];

const requiredFiles = [
  'README.md',
  'CHANGELOG.md',
  'render.yaml',
  'docker-compose.yml',
  '.env.example',
  '.env.test.example',
  '.env.docker.example',
  'docs/architecture.md',
  'docs/erd.md',
  'docs/testing.md',
  'docs/deployment.md',
  'docs/scaling.md',
  'docs/video-script.md',
  'docs/submission-checklist.md',
  'docs/screenshots/home.png',
  'docs/screenshots/login.png',
  'docs/screenshots/passenger.png',
  'docs/screenshots/driver.png',
];

for (const file of requiredFiles) {
  if (!existsSync(file)) failures.push(`missing required file: ${file}`);
}

const readme = readFileSync('README.md', 'utf8');
for (const requiredText of [
  'https://dhaka-tesla-pool-v2-web.vercel.app',
  'https://dhaka-tesla-pool-api-1h5u.onrender.com/health',
  '## AI usage',
  '## Architecture',
  '## ERD',
]) {
  if (!readme.includes(requiredText)) failures.push(`README is missing: ${requiredText}`);
}

if (/Pending Step 14 deployment/i.test(readme)) {
  failures.push('README still contains a pending deployment placeholder');
}

if (/Six-minute walkthrough \| \*\*Pending/i.test(readme)) {
  failures.push('README still needs the final six-minute video URL');
}

let tracked = [];
try {
  tracked = execFileSync('git', ['ls-files'], { encoding: 'utf8' })
    .split(/\r?\n/)
    .filter(Boolean);
} catch {
  failures.push('run the release check from inside the Git repository');
}

const forbiddenTracked = tracked.filter(
  (file) =>
    file === '.env' ||
    file === '.env.test' ||
    file.includes('node_modules/') ||
    file.includes('/.next/') ||
    file.includes('/dist/'),
);

for (const file of forbiddenTracked) failures.push(`forbidden tracked file: ${file}`);

const versions = [
  ['package.json', JSON.parse(readFileSync('package.json', 'utf8')).version],
  ['apps/api/package.json', JSON.parse(readFileSync('apps/api/package.json', 'utf8')).version],
  ['apps/web/package.json', JSON.parse(readFileSync('apps/web/package.json', 'utf8')).version],
];

for (const [file, version] of versions) {
  if (version !== '1.0.0') failures.push(`${file} version is ${version}, expected 1.0.0`);
}

if (failures.length) {
  console.error('Release check failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Release metadata, URLs, screenshots, version, and tracked-file checks passed.');