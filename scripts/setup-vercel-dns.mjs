#!/usr/bin/env node
/**
 * Add DMARC + Null MX for stratumielts.com on Vercel DNS.
 * Requires: VERCEL_TOKEN (https://vercel.com/account/tokens) or `vercel login` first.
 *
 * Usage:
 *   VERCEL_TOKEN=xxx node scripts/setup-vercel-dns.mjs
 *   node scripts/setup-vercel-dns.mjs --token xxx
 */

const DOMAIN = 'stratumielts.com';
const TEAM_ID = process.env.VERCEL_TEAM_ID || 'stratums-projects-053e839b';

const RECORDS_TO_ENSURE = [
  {
    name: '_dmarc',
    type: 'TXT',
    value: 'v=DMARC1; p=reject; pct=100; fo=1',
    comment: 'DMARC policy — stratumielts.com does not send mail',
  },
  {
    name: '',
    type: 'MX',
    value: '.',
    mxPriority: 0,
    comment: 'Null MX — domain does not accept inbound mail (RFC 7505)',
  },
];

function getToken() {
  const flagIdx = process.argv.indexOf('--token');
  if (flagIdx !== -1 && process.argv[flagIdx + 1]) {
    return process.argv[flagIdx + 1];
  }
  return process.env.VERCEL_TOKEN || '';
}

function teamQuery() {
  return TEAM_ID ? `?teamId=${encodeURIComponent(TEAM_ID)}` : '';
}

async function vercelFetch(token, path, options = {}) {
  const url = `https://api.vercel.com${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  const text = await res.text();
  let body;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }

  if (!res.ok) {
    const msg =
      typeof body === 'object' && body?.error?.message
        ? body.error.message
        : typeof body === 'object' && body?.message
          ? body.message
          : text || res.statusText;
    throw new Error(`${res.status} ${msg}`);
  }

  return body;
}

async function listRecords(token) {
  const data = await vercelFetch(
    token,
    `/v4/domains/${DOMAIN}/records${teamQuery()}&limit=100`
  );
  return data?.records || [];
}

function recordMatches(existing, desired) {
  if (existing.type !== desired.type) return false;
  if ((existing.name || '') !== (desired.name || '')) return false;

  if (desired.type === 'MX') {
    return (
      String(existing.value || '').replace(/\.$/, '') ===
        String(desired.value || '').replace(/\.$/, '') &&
      Number(existing.mxPriority ?? existing.priority ?? -1) ===
        Number(desired.mxPriority ?? 0)
    );
  }

  const normalizeTxt = (v) =>
    String(v || '')
      .replace(/^"|"$/g, '')
      .trim()
      .toLowerCase();

  return normalizeTxt(existing.value) === normalizeTxt(desired.value);
}

async function createRecord(token, record) {
  const payload = {
    name: record.name,
    type: record.type,
    value: record.value,
    ttl: 60,
    comment: record.comment,
  };
  if (record.type === 'MX') {
    payload.mxPriority = record.mxPriority;
  }

  return vercelFetch(token, `/v4/domains/${DOMAIN}/records${teamQuery()}`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

async function main() {
  const token = getToken();
  if (!token) {
    console.error(
      [
        'Missing VERCEL_TOKEN.',
        '',
        '1. Open https://vercel.com/account/tokens',
        '2. Create token (scope: Full Account or at least Domains)',
        '3. Run:',
        '   $env:VERCEL_TOKEN="your_token"; node scripts/setup-vercel-dns.mjs',
        '',
        'Or: vercel login   then   vercel dns add ...',
      ].join('\n')
    );
    process.exit(1);
  }

  console.log(`Checking DNS for ${DOMAIN}...`);
  const existing = await listRecords(token);
  console.log(`Found ${existing.length} existing record(s).`);

  for (const desired of RECORDS_TO_ENSURE) {
    const label =
      desired.type === 'MX'
        ? `MX @ → ${desired.value} (prio ${desired.mxPriority})`
        : `TXT ${desired.name} → ${desired.value.slice(0, 40)}...`;

    if (existing.some((r) => recordMatches(r, desired))) {
      console.log(`✓ Already exists: ${label}`);
      continue;
    }

    console.log(`+ Adding: ${label}`);
    await createRecord(token, desired);
    console.log(`  Done.`);
  }

  console.log('\nDNS updated. Propagation: 15 min – 48 h.');
  console.log(
    `Verify: https://mxtoolbox.com/SuperTool.aspx?action=mx%3a${DOMAIN}`
  );
}

main().catch((err) => {
  console.error('Failed:', err.message);
  process.exit(1);
});
