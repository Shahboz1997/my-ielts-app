import { readFileSync } from 'fs';
import { join } from 'path';

export { DEMO_PATHS } from '@/lib/demoReportPaths';

/** @typedef {{ slug: string, title: string, blurb: string, types: string[], bands: number[], flagship: boolean, href: string }} DemoCatalogEntry */

const DEMO_DIR = join(process.cwd(), 'content', 'demo');

/** @type {DemoCatalogEntry[] | null} */
let catalogCache = null;

/** @returns {DemoCatalogEntry[]} */
export function listDemoReports() {
  if (catalogCache) return catalogCache;
  try {
    const raw = JSON.parse(readFileSync(join(DEMO_DIR, 'catalog.json'), 'utf8'));
    catalogCache = Array.isArray(raw?.demos) ? raw.demos : [];
  } catch {
    catalogCache = [];
  }
  return catalogCache;
}

/** @returns {DemoCatalogEntry | null} */
export function getFlagshipDemo() {
  const demos = listDemoReports();
  return demos.find((d) => d.flagship) || demos[0] || null;
}

/** @param {string} slug */
export function getDemoMeta(slug) {
  return listDemoReports().find((d) => d.slug === slug) || null;
}

/**
 * Load durable demo snapshot (same shape as loadShareReport).
 * @param {string} slug
 */
export function loadDemoReport(slug) {
  const safe = String(slug || '').trim();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(safe)) return null;
  if (!getDemoMeta(safe)) return null;
  try {
    const report = JSON.parse(readFileSync(join(DEMO_DIR, `${safe}.json`), 'utf8'));
    if (!report || !Array.isArray(report.tasks) || report.tasks.length === 0) return null;
    return report;
  } catch {
    return null;
  }
}
