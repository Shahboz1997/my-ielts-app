/**
 * Facebook post copy and OpenAI image prompts for IELTS Writing campaigns.
 */

export const WRITING_IMAGE_PROMPTS = {
  1: [
    'Premium 3D illustration for an EdTech blog about IELTS Writing exam preparation and focused study.',
    'Scene: a modern minimalist desk with a sleek laptop or tablet showing abstract essay outline blocks and blurred lines (no readable text),',
    'a ceramic coffee cup, a stylized sheet of paper with abstract checkmark icons, subtle progress indicators or small gear elements suggesting productivity and improvement.',
    'Style: high-quality studio 3D render, corporate EdTech aesthetic, soft natural lighting, generous negative space.',
    'Color palette: deep navy blue and soft teal with one bright contrasting accent on the main focal element.',
    'Strict rules: NO letters, words, numbers, logos, watermarks, UI screenshots, photorealistic faces, or distorted text anywhere.',
    'Mood: calm focus, international exam preparation, professional productivity.',
  ].join(' '),
  2: [
    'Abstract flat design illustration for IELTS Writing success and achieving a high band score.',
    'Scene: a confident stylized figure climbing steps made of stacked books toward a glowing goal at the top,',
    'or alternatively a hand placing a final dot on an elegant abstract document next to a golden medal or star icon suggesting excellence (7.5+ as abstract symbol only — no numbers or text).',
    'Style: Corporate Memphis or modern flat vector design, premium EdTech editorial look, clean composition.',
    'Color palette: deep blue, pastel lavender, soft turquoise with a vivid gold accent on the achievement icon.',
    'Strict rules: NO letters, words, numbers, logos, watermarks, photorealism, mascots with distorted faces, or any readable typography.',
    'Mood: confidence, progress, reaching your IELTS Writing goal.',
  ].join(' '),
};

export const WRITING_POST_CAPTION = `✍️ IELTS Writing: small daily habits, big band-score gains

Task 2 rewards clear structure — not fancy vocabulary alone. Before you write, spend 2 minutes on a simple plan:

• State your position in the introduction
• One main idea per body paragraph
• Link each paragraph back to the question
• Leave 3–5 minutes to proofread grammar and articles

Consistency beats cramming. Even 20 focused minutes a day builds the muscle memory examiners look for.

👉 Practice your IELTS Writing now: https://stratumielts.com`;

/**
 * @param {number | string} [variant]
 * @returns {{ variant: number, prompt: string, caption: string }}
 */
export function getWritingFacebookPost(variant = 1) {
  const n = Number(variant);
  const key = WRITING_IMAGE_PROMPTS[n] ? n : 1;
  return {
    variant: key,
    prompt: WRITING_IMAGE_PROMPTS[key],
    caption: WRITING_POST_CAPTION,
  };
}
