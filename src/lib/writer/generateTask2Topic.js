import { getHttpErrorResponse, postJson } from '@/lib/httpClient';

export function parseGenerateTopicError(e) {
  const { status, data } = getHttpErrorResponse(e);
  const serverMessage = data && typeof data.message === 'string' ? data.message : null;
  const dataError = data && typeof data.error === 'string' ? data.error : null;
  const isApiKeyError =
    status === 401 ||
    status === 503 ||
    dataError === 'INVALID_API_KEY' ||
    dataError === 'Server Configuration Error: Missing API Key' ||
    dataError === 'Environment variable NOT LOADED';

  if (status === 401) {
    return 'Authentication failed. The server is still using an old API Key (nTkA).';
  }
  if (isApiKeyError) {
    return 'Check API Key. Add a valid OPENAI_API_KEY to .env.local.';
  }
  return serverMessage || dataError || e?.message || 'Request failed. Please try again.';
}

export async function generateTask2Topic(keyword) {
  try {
    const data = await postJson('/api/check', { generateTopic: true, keyword });
    const question = data?.question;
    if (question) {
      return { ok: true, question };
    }
    return {
      ok: false,
      error: data?.error || data?.message || 'No topic returned. Please try again.',
    };
  } catch (e) {
    return { ok: false, error: parseGenerateTopicError(e) };
  }
}
