/**
 * One-off: mark a user's email as verified (e.g. confirmation email never arrived).
 * Usage: node scripts/verify-user-email.mjs user@example.com
 */
import "dotenv/config";
import { getPrisma } from "../src/lib/prisma.js";

const email = String(process.argv[2] || "")
  .trim()
  .toLowerCase();
if (!email) {
  console.error("Usage: node scripts/verify-user-email.mjs user@example.com");
  process.exit(1);
}

const prisma = getPrisma();
const user = await prisma.user.update({
  where: { email },
  data: { emailVerified: new Date() },
});
console.log(`[verify-email] Verified: ${user.email} (${user.id})`);
await prisma.$disconnect();
