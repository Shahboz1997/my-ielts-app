#!/usr/bin/env node
const { readFileSync } = require('fs');
const { join } = require('path');

const root = join(__dirname, '..');
for (const line of readFileSync(join(root, '.env.local'), 'utf8').split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eq = trimmed.indexOf('=');
  if (eq === -1) continue;
  process.env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
}

const CAPTION = `✍️ IELTS Writing Task 2 — stop writing filler

A 6.5 isn't "bad English." It's an essay where half the words prove nothing.

You know the structure. You know linking words. But the examiner still gives 6.0–6.5 — because Task Response isn't scored on paragraph count. It's scored on how well each paragraph answers the question.

🔹 Tip 1. One idea = one paragraph

❌ Nowadays, technology is very important in our life and it affects many people in different ways.
✅ Remote work tools allow employees to collaborate across time zones, which reduces the need for daily commuting.

🔹 Tip 2. Answer the question, don't explain the topic

❌ Many students use phones. Phones are useful for learning. Some schools ban them.
✅ I largely agree that smartphones disrupt learning, because notifications break students' concentration during lessons.

🔹 Tip 3. Examples = mini-proof, not "for example"

❌ For example, many people use the internet.
✅ For instance, in many European cities, bike-sharing schemes have reduced short car trips by up to 30%.

💡 30-second check: Read only the first sentence of each body paragraph. If you can't tell whether you agree or disagree — your essay is still mostly filler.

💬 Which Task 2 topic do you most often stretch to 250 words without a clear position? Drop it in the comments.

👉 Practice your IELTS Writing now: https://stratumielts.com`;

async function main() {
  const { generatePostBanner } = await import('../src/lib/facebookImageGen.js');
  const { postImageToFacebookPage, validateFacebookPageCredentials, cleanBrokenTlsEnv } =
    await import('../src/lib/facebook.js');

  cleanBrokenTlsEnv();
  const validation = await validateFacebookPageCredentials();
  if (!validation.ok) throw new Error(validation.error);

  console.log('Page:', validation.creds.pageName);
  console.log('Generating banner…');
  const image = await generatePostBanner('IELTS Writing Task 2 — focused essay structure, EdTech study');

  console.log('Publishing…');
  const result = await postImageToFacebookPage(image, CAPTION);
  if (!result.success) throw new Error(JSON.stringify(result.error));
  console.log('Posted! id:', result.id);
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
