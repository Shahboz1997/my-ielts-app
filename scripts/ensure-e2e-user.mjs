/**
 * Ensures E2E_TEST_EMAIL exists with E2E_TEST_PASSWORD (bcrypt) and credits for /api/check.
 * Run before Playwright when DATABASE_URL is set (CI or local E2E).
 */
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { CREDITS_DEFAULT_NEW_USER } from '../src/lib/credits.js';

const email = String(process.env.E2E_TEST_EMAIL || '')
  .trim()
  .toLowerCase();
const password = process.env.E2E_TEST_PASSWORD;

if (!email || !password) {
  console.log('[e2e] Skip user seed: set E2E_TEST_EMAIL and E2E_TEST_PASSWORD');
  process.exit(0);
}

const { getPrisma } = await import('../src/lib/prisma.js');
const prisma = getPrisma();
const hashed = await bcrypt.hash(String(password), 10);
const credits = Math.max(CREDITS_DEFAULT_NEW_USER, 10);

await prisma.user.upsert({
  where: { email },
  create: {
    email,
    password: hashed,
    name: 'E2E User',
    credits,
    emailVerified: new Date(),
  },
  update: {
    password: hashed,
    credits: { set: credits },
    emailVerified: new Date(),
  },
});

console.log(`[e2e] User ready: ${email} (${credits} credits)`);
await prisma.$disconnect();
