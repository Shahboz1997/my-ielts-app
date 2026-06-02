/**
 * Share links are public; avoid pulling auth/session into a dedicated segment when possible.
 * Root layout still provides Providers — this file only sets caching hints for the subtree.
 */
export const revalidate = 3600;

export default function ShareLayout({ children }) {
  return children;
}
