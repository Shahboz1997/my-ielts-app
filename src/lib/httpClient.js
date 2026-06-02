const JSON_HEADERS = { 'Content-Type': 'application/json' };

/** Error shape compatible with interpretAnalyzeFailure (axios-like .response). */
export function createHttpError(res, data = {}) {
  const message =
    (typeof data?.error === 'string' && data.error) ||
    (typeof data?.message === 'string' && data.message) ||
    res.statusText ||
    'Request failed';
  const err = new Error(message);
  err.response = { status: res.status, data };
  return err;
}

export function getHttpErrorResponse(err) {
  if (err?.response?.status != null) {
    return { status: err.response.status, data: err.response.data };
  }
  return { status: undefined, data: undefined };
}

export async function postJson(url, body, init = {}) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { ...JSON_HEADERS, ...(init.headers || {}) },
    body: JSON.stringify(body),
    signal: init.signal,
    cache: init.cache,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw createHttpError(res, data);
  return data;
}

export async function deleteRequest(url) {
  const res = await fetch(url, { method: 'DELETE' });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw createHttpError(res, data);
  }
}
