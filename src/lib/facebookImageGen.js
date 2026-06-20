/**
 * Branded post banners for Facebook cross-posting via OpenAI Images API.
 */
import OpenAI from 'openai';

const DEFAULT_IMAGE_MODEL = 'gpt-image-1';

function getOpenAIBaseURL() {
  const raw = process.env.OPENAI_BASE_URL;
  const base = typeof raw === 'string' ? raw.trim() : 'https://api.openai.com/v1';
  const url = base.length > 0 ? base : 'https://api.openai.com/v1';
  return url.endsWith('/v1') ? url : `${url.replace(/\/?$/, '')}/v1`;
}

function getImageModel() {
  return (process.env.OPENAI_IMAGE_MODEL || DEFAULT_IMAGE_MODEL).trim();
}

function getImageQuality(model) {
  const fromEnv = (process.env.OPENAI_IMAGE_QUALITY || '').trim();
  if (fromEnv) return fromEnv;
  if (model.startsWith('gpt-image')) return 'medium';
  return 'standard';
}

function createBannerOpenAI() {
  const apiKey = (process.env.OPENAI_API_KEY || '').trim();
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not set — add it to .env.local');
  }

  const project = (process.env.OPENAI_PROJECT_ID || '').trim();
  const organization = (process.env.OPENAI_ORG_ID || '').trim();

  return new OpenAI({
    apiKey,
    baseURL: getOpenAIBaseURL(),
    project: project || undefined,
    organization: organization || undefined,
    maxRetries: 4,
    timeout: 120_000,
  });
}

function buildBannerPrompt(topicDescription) {
  const topic = String(topicDescription ?? 'IELTS writing preparation').trim();

  return [
    'Create a single square social-media cover image for an IELTS English exam prep brand called STRATUM IELTS.',
    `Theme for today: ${topic}.`,
    '',
    'Visual style: Scandinavian / European academic minimalism — calm, premium, editorial.',
    'Palette: soft pastels or refined deep tones (sage, warm beige, muted navy, soft terracotta).',
    'Scene: cozy focused study desk — open laptop showing a structured essay outline (abstract blurred lines, no readable words),',
    'a ceramic coffee cup, neat English textbooks and a notebook, soft natural window light.',
    'Aesthetic references: Notion, Pinterest, Kinfolk magazine — clean composition, generous negative space.',
    '',
    'Strict rules:',
    '- NO text, letters, logos, watermarks, or UI screenshots on the image.',
    '- NO 3D cartoon characters, mascots, clip-art, or cheap stock-photo clichés.',
    '- NO visual clutter, neon colors, or busy backgrounds.',
    '- Photorealistic or soft editorial photography feel; single cohesive scene.',
    '- Mood: focus, calm study session, professional IELTS preparation.',
  ].join('\n');
}

/**
 * @typedef {{ url?: string, buffer?: Buffer }} PostBannerImage
 */

/**
 * Generate a 1024×1024 branded banner for a daily post slot.
 * gpt-image-1 returns base64; dall-e-3 returns a temporary URL.
 * @param {string} topicDescription
 * @returns {Promise<PostBannerImage>}
 */
export async function generatePostBanner(topicDescription) {
  const openai = createBannerOpenAI();
  const model = getImageModel();
  const prompt = buildBannerPrompt(topicDescription);

  console.log('[facebookImageGen] Generating banner for:', topicDescription, `(model: ${model})`);

  const response = await openai.images.generate({
    model,
    prompt,
    n: 1,
    size: '1024x1024',
    quality: getImageQuality(model),
  });

  const item = response.data?.[0];
  if (item?.url) {
    console.log('[facebookImageGen] Banner ready (url)');
    return { url: item.url };
  }

  if (item?.b64_json) {
    console.log('[facebookImageGen] Banner ready (base64)');
    return { buffer: Buffer.from(item.b64_json, 'base64') };
  }

  throw new Error(`${model} returned no image data`);
}
