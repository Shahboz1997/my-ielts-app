import { getMetadataBaseUrl } from '@/lib/publicSiteUrl';
import { listDemoReports } from '@/lib/demoReports';

/** Public indexable routes — dashboard/auth/private share omitted. */
const PATHS = [
  { path: '/', changeFrequency: 'weekly', priority: 1 },
  { path: '/landing', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/privacy', changeFrequency: 'yearly', priority: 0.4 },
  { path: '/data-deletion', changeFrequency: 'yearly', priority: 0.4 },
  { path: '/terms', changeFrequency: 'yearly', priority: 0.4 },
  { path: '/refund', changeFrequency: 'yearly', priority: 0.4 },
];

export default function sitemap() {
  const base = getMetadataBaseUrl().replace(/\/$/, '');
  const lastModified = new Date();
  const staticUrls = PATHS.map(({ path, changeFrequency, priority }) => ({
    url: `${base}${path === '/' ? '/' : path}`,
    lastModified,
    changeFrequency,
    priority,
  }));

  const demoUrls = listDemoReports().map((d) => ({
    url: `${base}${d.href}`,
    lastModified,
    changeFrequency: 'monthly',
    priority: d.flagship ? 0.85 : 0.7,
  }));

  return [...staticUrls, ...demoUrls];
}
