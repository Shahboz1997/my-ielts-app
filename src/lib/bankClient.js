import { clientApiUrl } from './clientApiUrl.js';

/**
 * URL for Writing bank API (Next.js /api/topics, /api/templates, /api/bank/*).
 * @param {string} path e.g. `/api/topics?type=task2`
 */
export function bankApiUrl(path) {
  return clientApiUrl(path);
}
