import https from 'https';
import http from 'http';
import { URL as NodeURL } from 'url';

/**
 * Vision models sometimes return a full "sample report" despite instructions — drop it and use standard wording only.
 */
export function sanitizeTask1VisionIntro(raw) {
  if (typeof raw !== 'string') return '';
  let s = raw.trim();
  const fence = /^```(?:\w*)?\s*([\s\S]*?)```\s*$/m.exec(s);
  if (fence) s = fence[1].trim();
  s = s.replace(/^["']|["']$/g, '').trim();
  if (!s || /^none\.?$/i.test(s)) return '';
  const words = s.split(/\s+/).filter(Boolean);
  if (words.length > 90) return '';
  const paras = s.split(/\n\s*\n/).filter((p) => p.trim());
  if (paras.length > 2) return '';
  const lower = s.toLowerCase();
  if (
    lower.includes('in conclusion') ||
    lower.includes('to sum up') ||
    lower.includes('to summarise') ||
    lower.includes('in summary,')
  ) {
    return '';
  }
  const digitGroups = s.match(/\d[\d,.\s]*/g) || [];
  if (digitGroups.length >= 5) return '';
  const essayPhrases = [
    'overall,',
    'overall the',
    'it can be seen that',
    'it is clear that',
    'peaking at',
    'the second highest',
    'respectively.',
    'by contrast',
  ];
  let hits = 0;
  for (const ph of essayPhrases) {
    if (lower.includes(ph)) hits++;
  }
  if (hits >= 2) return '';
  return s;
}

export const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
export const MAX_DATA_URL_CHARS = 10_000_000; // ~7.5MB base64 payload depending on header

/** Prefer Node http(s) — global fetch/Undici often throws "fetch failed" for some CDNs on Windows. */
export function downloadImageAsDataUrl(imageUrl, redirectCount = 0) {
  if (redirectCount > 10) {
    return Promise.reject(new Error('Too many redirects while fetching image'));
  }

  return new Promise((resolve, reject) => {
    let parsed;
    try {
      parsed = new NodeURL(imageUrl);
    } catch {
      reject(new Error('Invalid image URL'));
      return;
    }

    const lib = parsed.protocol === 'https:' ? https : parsed.protocol === 'http:' ? http : null;
    if (!lib) {
      reject(new Error('Only http(s) image URLs are supported'));
      return;
    }

    const req = lib.request(
      imageUrl,
      {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; StratumIELTS/1.0)',
          Accept: 'image/*,*/*;q=0.8',
        },
        timeout: 60_000,
      },
      (res) => {
        const loc = res.headers.location;
        if (res.statusCode >= 300 && res.statusCode < 400 && loc) {
          res.resume();
          const nextUrl = new NodeURL(loc, imageUrl).href;
          downloadImageAsDataUrl(nextUrl, redirectCount + 1).then(resolve).catch(reject);
          return;
        }

        if (res.statusCode !== 200) {
          res.resume();
          reject(new Error(`Failed to fetch image: HTTP ${res.statusCode}`));
          return;
        }

        const rawType = (res.headers['content-type'] || '').split(';')[0].trim();
        const chunks = [];
        let total = 0;

        res.on('data', (chunk) => {
          total += chunk.length;
          if (total > MAX_IMAGE_BYTES) {
            res.destroy();
            reject(new Error('Image is too large'));
            return;
          }
          chunks.push(chunk);
        });

        res.on('end', () => {
          try {
            const buffer = Buffer.concat(chunks);
            let contentType =
              rawType && rawType.startsWith('image/') ? rawType : '';
            if (!contentType) {
              const b0 = buffer[0];
              const b1 = buffer[1];
              if (b0 === 0xff && b1 === 0xd8) contentType = 'image/jpeg';
              else if (b0 === 0x89 && buffer.toString('ascii', 1, 4) === 'PNG') contentType = 'image/png';
              else if (b0 === 0x47 && b1 === 0x49) contentType = 'image/gif';
              else if (b0 === 0x52 && b1 === 0x49) contentType = 'image/webp';
              else contentType = 'application/octet-stream';
            }
            resolve(`data:${contentType};base64,${buffer.toString('base64')}`);
          } catch (e) {
            reject(e);
          }
        });
      }
    );

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Image fetch timeout'));
    });
    req.on('error', reject);
    req.end();
  });
}

export async function imageUrlToBase64(url) {
  try {
    return await downloadImageAsDataUrl(url);
  } catch (nodeErr) {
    console.warn('[/api/check] imageUrlToBase64: Node http(s) failed, trying fetch:', nodeErr?.message);
    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; StratumIELTS/1.0)' },
      });

      if (!response.ok) throw new Error(`Failed to fetch image: ${response.status}`);

      const contentType = response.headers.get('content-type');
      const ct = contentType ? contentType.split(';')[0].trim() : '';
      if (!ct || !ct.startsWith('image/')) {
        throw new Error(`Invalid MIME type: ${contentType || '(none)'}. Expected an image.`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      if (buffer.length > MAX_IMAGE_BYTES) throw new Error('Image is too large');
      return `data:${ct};base64,${buffer.toString('base64')}`;
    } catch (fetchErr) {
      console.error('[/api/check] imageUrlToBase64: fetch failed:', fetchErr?.message);
      throw fetchErr;
    }
  }
}
