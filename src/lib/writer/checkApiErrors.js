/** Must match AUTH_REQUIRED_CODE in @/lib/aiAccessShared (kept local to avoid Edge/crypto in client bundle). */
const AUTH_REQUIRED_CODE = 'AUTH_REQUIRED';

const API_KEY_CODES = new Set([
  'INVALID_API_KEY',
  'MISSING_API_KEY',
  'MISSING_PROJECT_ID',
]);

/**
 * Normalize axios/fetch errors from /api/check and similar routes.
 */
export function parseCheckApiError(e, { authMessage = 'Sign in to continue.' } = {}) {
  const status = e.response?.status;
  const data = e.response?.data;
  const apiCode = data && typeof data === 'object' ? data.code : null;
  const serverMessage = data && typeof data.message === 'string' ? data.message : null;
  const dataError =
    typeof data === 'object' && data !== null && typeof data.error === 'string' ? data.error : null;

  const isAuthRequired = apiCode === AUTH_REQUIRED_CODE;
  const isApiKeyError =
    API_KEY_CODES.has(apiCode) ||
    status === 503 ||
    dataError === 'INVALID_API_KEY' ||
    dataError === 'Server Configuration Error: Missing API Key' ||
    dataError === 'Environment variable NOT LOADED';

  let display;
  if (isAuthRequired) {
    display = dataError || authMessage;
  } else if (isApiKeyError) {
    display =
      dataError ||
      'OpenAI is not configured. Add a valid OPENAI_API_KEY to .env.local and restart npm run dev.';
  } else if (status === 401) {
    display =
      dataError ||
      serverMessage ||
      'Request unauthorized (401). Check your OPENAI_API_KEY in .env.local and restart the dev server.';
  } else {
    display = serverMessage || dataError || e.message || 'Request failed. Please try again.';
  }

  return {
    display,
    isAuthRequired,
    isApiKeyError,
    is401: status === 401 && !isAuthRequired && !isApiKeyError,
    status,
    dataError,
  };
}
