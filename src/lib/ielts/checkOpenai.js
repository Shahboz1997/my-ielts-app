import {
  createOpenAIClient,
  getTrimmedOpenAIKey,
  getTrimmedOpenAIProjectId,
} from '@/lib/openaiServer.js';

let _openaiKeyLogged = false;

/** Retries transient Undici/Node "fetch failed" / connection drops when calling OpenAI. */
export async function resilientFetch(input, init) {
  const max = 4;
  let lastErr;
  for (let attempt = 0; attempt < max; attempt++) {
    try {
      return await fetch(input, init);
    } catch (err) {
      lastErr = err;
      const msg = String(err?.message || err?.cause?.message || '').toLowerCase();
      const code = err?.cause?.code || err?.code;
      const retryable =
        msg.includes('fetch failed') ||
        msg.includes('econnreset') ||
        msg.includes('etimedout') ||
        msg.includes('epipe') ||
        msg.includes('socket') ||
        code === 'ECONNRESET' ||
        code === 'ETIMEDOUT' ||
        code === 'ECONNREFUSED';
      if (!retryable || attempt === max - 1) throw err;
      await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
    }
  }
  throw lastErr;
}

export function getOpenAIClient() {
  if (!_openaiKeyLogged) {
    _openaiKeyLogged = true;
    const apiKey = getTrimmedOpenAIKey();
    console.log(
      `[DEBUG] OpenAI key: ${apiKey.slice(0, 7)}...${apiKey.slice(-4)} project: ${getTrimmedOpenAIProjectId() || '(none)'}`
    );
  }
  return createOpenAIClient({ fetch: resilientFetch });
}
