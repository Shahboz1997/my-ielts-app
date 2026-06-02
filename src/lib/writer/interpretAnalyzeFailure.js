import { getHttpErrorResponse } from '@/lib/httpClient';
import {
  AUTH_REQUIRED_CODE,
  GUEST_QUOTA_EXHAUSTED_CODE,
  RATE_LIMIT_EXCEEDED_CODE,
} from '@/lib/aiAccessShared';

/** Readable message + metadata when /api/check fails (empty JSON `{}`, HTML, network, etc.). */
export function interpretAnalyzeFailure(err) {
  const fallback = { status: undefined, dataError: undefined, message: 'Analysis failed.' };

  const { status, data: raw } = getHttpErrorResponse(err);

  let dataError;
  let apiCode =
    raw && typeof raw === 'object' && typeof raw.code === 'string' ? raw.code : null;

  if (raw == null || raw === '') {
    dataError = undefined;
  } else if (typeof raw === 'string') {
    const stripped = raw.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    dataError = stripped.length > 0 ? stripped.slice(0, 280) : undefined;
  } else if (typeof raw === 'object') {
    const keys = Object.keys(raw);
    if (keys.length === 0) {
      dataError = undefined;
    } else {
      if (typeof raw.error === 'string' && raw.error) dataError = raw.error;
      else if (typeof raw.message === 'string' && raw.message) dataError = raw.message;
      else if (typeof raw.code === 'string' && raw.code) dataError = raw.code;
    }
  }

  let message = dataError;

  if (apiCode === GUEST_QUOTA_EXHAUSTED_CODE || apiCode === AUTH_REQUIRED_CODE) {
    message = dataError || 'Please sign in to use this feature.';
  } else if (apiCode === RATE_LIMIT_EXCEEDED_CODE) {
    message = dataError || 'Too many requests. Please wait a moment and try again.';
  }

  if (!message) {
    if (status === 413) {
      message = 'Request payload too large. Try a shorter essay or a smaller image.';
    } else if (status === 403) {
      message =
        typeof dataError === 'string' && dataError
          ? dataError
          : 'You have no credits left. For top-ups and billing, use the support email in the site footer.';
    } else if (status === 401) {
      message = 'Please sign in to ANALYZE STRATUM DATA.';
    } else if (status === 429) {
      message = dataError || 'Too many requests. Please wait a moment and try again.';
    } else if (status === 503 || status === 502) {
      message = 'Service temporarily unavailable. Check OPENAI_API_KEY and try again.';
    } else if (status === 504) {
      message = 'The analysis request timed out. Please try again.';
    } else if (status === 500) {
      message = 'Server error while analyzing. Please try again in a moment.';
    } else if (status === 400) {
      message = 'Invalid request (e.g. text too short). Check your input and try again.';
    } else if (err && !status && typeof err.message === 'string') {
      message =
        err.name === 'AbortError'
          ? 'Request timed out. Please try again.'
          : err.message || 'Network error. Check your connection and try again.';
    } else {
      message = `Request failed${status != null ? ` (${status})` : ''}. Please try again.`;
    }
  }

  return { status, dataError, message, apiCode };
}
