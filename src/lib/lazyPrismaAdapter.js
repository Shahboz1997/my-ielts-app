import { PrismaAdapter } from "@auth/prisma-adapter";
import { getPrisma, withPrismaRetry } from "@/lib/prisma";

/** Methods exposed by @auth/prisma-adapter (Auth.js v5). */
const ADAPTER_METHODS = [
  "createUser",
  "getUser",
  "getUserByEmail",
  "getUserByAccount",
  "updateUser",
  "deleteUser",
  "linkAccount",
  "unlinkAccount",
  "getAccount",
  "createSession",
  "getSessionAndUser",
  "updateSession",
  "deleteSession",
  "createVerificationToken",
  "useVerificationToken",
  "createAuthenticator",
  "getAuthenticator",
  "listAuthenticatorsByUserId",
  "updateAuthenticatorCounter",
];

/**
 * Auth.js PrismaAdapter captures one PrismaClient at construction time.
 * withPrismaRetry() may call resetPrismaClients() and end the pg pool; a stale
 * adapter then throws "Cannot use a pool after calling end on the pool" on OAuth.
 * Each call uses PrismaAdapter(getPrisma()) so the adapter always matches the live pool.
 */
export function createLazyPrismaAdapter() {
  const lazy = {};
  for (const method of ADAPTER_METHODS) {
    lazy[method] = async (...args) => {
      return withPrismaRetry(async () => {
        const adapter = PrismaAdapter(getPrisma());
        const fn = adapter[method];
        if (typeof fn !== "function") {
          throw new TypeError(`PrismaAdapter.${method} is not a function`);
        }
        return fn.apply(adapter, args);
      }, { attempts: 4 });
    };
  }
  return lazy;
}
