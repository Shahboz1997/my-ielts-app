import * as bank from './bankCore.js';

const detailCache = new Map();
const CACHE_TTL_MS = Number(process.env.BANK_TOPIC_CACHE_TTL_MS) || 120_000;

function cacheGet(key) {
  const row = detailCache.get(key);
  if (!row) return undefined;
  if (Date.now() - row.at > CACHE_TTL_MS) {
    detailCache.delete(key);
    return undefined;
  }
  return row.payload;
}

function cacheSet(key, payload) {
  detailCache.set(key, { payload, at: Date.now() });
}

/**
 * GET /api/bank/topic/:id payload (cached per server instance).
 * @returns {{ ok: true, payload: object } | { ok: false, status: 404 }}
 */
export function getTopicDetailById(rawId) {
  const cacheKey = String(rawId);
  const hit = cacheGet(cacheKey);
  if (hit) {
    return { ok: true, payload: hit };
  }
  const topic = bank.getTopicById(rawId);
  if (!topic) {
    return { ok: false, status: 404 };
  }
  const payload = bank.topicDetailPayload(topic);
  if (!payload) {
    return { ok: false, status: 404 };
  }
  cacheSet(cacheKey, payload);
  return { ok: true, payload };
}
