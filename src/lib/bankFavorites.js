export const FAVORITE_TEMPLATES_STORAGE_KEY = 'ielts_bank_favorite_templates';
export const FAVORITE_TEMPLATES_UPDATED_EVENT = 'stratum_favorite_templates_updated';

export function loadFavoriteTemplateIds() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(FAVORITE_TEMPLATES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(Number).filter((n) => Number.isFinite(n) && n > 0);
  } catch {
    return [];
  }
}

export function persistFavoriteTemplateIds(ids) {
  if (typeof window === 'undefined') return;
  try {
    const clean = [...new Set(ids.map(Number).filter((n) => Number.isFinite(n) && n > 0))];
    localStorage.setItem(FAVORITE_TEMPLATES_STORAGE_KEY, JSON.stringify(clean));
    window.dispatchEvent(new Event(FAVORITE_TEMPLATES_UPDATED_EVENT));
  } catch {
    /* ignore */
  }
}
