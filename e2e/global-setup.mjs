import { execSync } from 'node:child_process';

export default async function globalSetup() {
  if (!process.env.E2E_TEST_EMAIL || !process.env.DATABASE_URL) return;
  execSync('node ./scripts/ensure-e2e-user.mjs', {
    stdio: 'inherit',
    env: process.env,
  });
}
