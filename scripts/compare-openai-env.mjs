import fs from 'fs';

function parseEnv(path) {
  const out = {};
  if (!fs.existsSync(path)) return out;
  for (const line of fs.readFileSync(path, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq);
    let value = trimmed.slice(eq + 1);
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

const local = parseEnv('.env.local');
const prod = parseEnv('.env.vercel.production');

const mask = (key) =>
  !key ? '(missing)' : key.length < 8 ? '(too short)' : `${key.slice(0, 7)}...${key.slice(-4)}`;

console.log('LOCAL  OPENAI_API_KEY:', mask(local.OPENAI_API_KEY), 'len', local.OPENAI_API_KEY?.length ?? 0);
console.log('PROD   OPENAI_API_KEY:', mask(prod.OPENAI_API_KEY), 'len', prod.OPENAI_API_KEY?.length ?? 0);
console.log('KEYS_MATCH:', (local.OPENAI_API_KEY || '') === (prod.OPENAI_API_KEY || ''));
console.log('LOCAL  OPENAI_PROJECT_ID:', local.OPENAI_PROJECT_ID || '(none)');
console.log('PROD   OPENAI_PROJECT_ID:', prod.OPENAI_PROJECT_ID || '(none)');
console.log('PROJECT_MATCH:', (local.OPENAI_PROJECT_ID || '') === (prod.OPENAI_PROJECT_ID || ''));
