/**
 * Hostnames allowed for `next/image` remote optimization (HTTPS only).
 * Keep in sync with Task 1 sample chart URLs in src/app/page.js.
 *
 * Optional extra hosts (comma-separated): IMAGE_ALLOWED_HOSTS=your-cdn.com
 * Example domains like cdn.example.com are placeholders — they do not host real chart images.
 */
export const ALLOWED_IMAGE_HOSTNAMES = [
  // IELTS sample charts / prep sites
  'ieltsmaterial.com',
  'exam-english.ru',
  'goltc.in',
  'ieltscharlie.com',
  'etest.edu.vn',
  'thecatalyst.edu.vn',
  'ielts-writing.info',
  'www.ielts-writing.info',
  'ielts-jonathan.com',
  'ielts-up.com',
  'ieltsfocus.com',
  'aehelp.com',
  'www.aehelp.com',
  'anu.edu.vn',
  'cloud.educaplay.com',
  // CDNs used by the URLs above
  'i0.wp.com',
  'i1.wp.com',
  'i2.wp.com',
  'us.v-cdn.net',
  // Bing image search thumbnails (sample tasks)
  'th.bing.com',
  'tse1.mm.bing.net',
  'tse3.mm.bing.net',
  'tse4.mm.bing.net',
  // YouTube chart thumbnails
  'i.ytimg.com',
  // OAuth profile photos (Settings, Navbar if migrated to next/image)
  'lh3.googleusercontent.com',
  'lh4.googleusercontent.com',
  'lh5.googleusercontent.com',
  'lh6.googleusercontent.com',
];

function parseEnvHosts() {
  const raw =
    process.env.IMAGE_ALLOWED_HOSTS || process.env.NEXT_PUBLIC_IMAGE_HOSTS || '';
  return raw
    .split(/[,;\s]+/)
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean);
}

/** @returns {import('next/dist/shared/lib/image-config').RemotePattern[]} */
export function getAllowedImageRemotePatterns() {
  const hosts = [...new Set([...ALLOWED_IMAGE_HOSTNAMES, ...parseEnvHosts()])];
  return hosts.map((hostname) => ({
    protocol: 'https',
    hostname,
  }));
}

