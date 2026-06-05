/**
 * Evening Telegram quiz pool + lookup for /telegram-quiz breakdown page.
 */
import { daySlotIndex, pickByIndex } from '@/lib/telegramSchedule';

export const TELEGRAM_QUIZ_POOL = [
  {
    question: 'Where does the examiner expect the overview in Task 1?',
    options: [
      'In the conclusion',
      'Right after the introduction',
      'In every body paragraph',
      'Overview is not required',
    ],
    correctOptionId: 1,
    explanation:
      'The overview is 1–2 sentences on the main trend without specific figures. Place it right after the intro, before body paragraphs. Missing an overview costs Task Achievement points.',
  },
  {
    question: 'Where should your position go in an opinion essay (Task 2)?',
    options: [
      'Only in the conclusion',
      'In body paragraph 2',
      'At the end of the introduction (thesis)',
      'Nowhere — arguments are enough',
    ],
    correctOptionId: 2,
    explanation:
      'Examiners look for a clear thesis at the end of the introduction: This essay strongly agrees/disagrees that… A position hidden in the body weakens Task Response.',
  },
  {
    question: 'What must you NOT do in Task 1 (graph/table)?',
    options: [
      'Compare data categories',
      'Give your opinion and recommendations',
      'Use passive voice',
      'Write an overview',
    ],
    correctOptionId: 1,
    explanation:
      'Task 1 is data description only. Opinions, reasons, and advice belong in Task 2. Personal opinion in Task 1 lowers TA.',
  },
  {
    question: 'How many main ideas per body paragraph in Task 2?',
    options: ['1', '2–3', 'As many as fit', 'Does not matter'],
    correctOptionId: 0,
    explanation:
      'One paragraph = one central idea + support. Mixing arguments hurts Coherence — examiners see ideas "jumping" between topics.',
  },
  {
    question: 'What is required in a discussion essay?',
    options: [
      'Only your position',
      'Both sides + your conclusion',
      'Only arguments "for"',
      'A list of examples without structure',
    ],
    correctOptionId: 1,
    explanation:
      'Discuss both views = cover both sides, then give your balanced opinion in the conclusion. One side only = incomplete Task Response.',
  },
  {
    question: 'What is the minimum word count for Task 2?',
    options: ['150', '200', '250', '300'],
    correctOptionId: 2,
    explanation:
      'Under 250 words triggers a Task Achievement penalty. Aim for 250–280 words for a safe range.',
  },
  {
    question: 'Where do linking words work best?',
    options: [
      'In every sentence',
      'Between paragraphs and within logical blocks',
      'Only in the conclusion',
      'Linking words are not needed',
    ],
    correctOptionId: 1,
    explanation:
      'However, Furthermore, In contrast — between paragraphs and when shifting ideas. Overusing linking words sounds unnatural (CC drops).',
  },
  {
    question: 'What belongs in a Task 2 conclusion?',
    options: [
      'A new argument with an example',
      'Paraphrased thesis + brief summary',
      'A copy of body paragraph 1',
      'A question to the reader',
    ],
    correctOptionId: 1,
    explanation:
      'The conclusion paraphrases your position and summarizes. New ideas or examples in the conclusion are a common mistake (−0.5 band).',
  },
  {
    question: 'Task 1 process diagram: which voice is usually needed?',
    options: ['Active voice', 'Passive voice', 'Imperative', 'Conditional'],
    correctOptionId: 1,
    explanation:
      'A process describes stages: water is collected, is filtered, is stored. Passive voice is standard for process Task 1.',
  },
  {
    question: 'What lowers Lexical Resource (LR)?',
    options: [
      'Synonyms for common words',
      'Repeating the same word 5+ times',
      'Topic-specific vocabulary',
      'Collocations',
    ],
    correctOptionId: 1,
    explanation:
      'Repeating important/important/important → swap for significant, crucial, vital. Lexical variety raises LR.',
  },
];

/** @param {Date} date */
export function pickEveningQuiz(date = new Date()) {
  const idx = daySlotIndex(date, 'evening');
  return pickByIndex(TELEGRAM_QUIZ_POOL, idx);
}

/**
 * @param {string} campaignId e.g. evening_2026-06-06
 */
export function getQuizForCampaign(campaignId) {
  const m = String(campaignId || '').match(/^evening_(\d{4}-\d{2}-\d{2})$/);
  if (!m) return null;
  const date = new Date(`${m[1]}T12:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return null;
  const quiz = pickEveningQuiz(date);
  if (!quiz) return null;
  return { ...quiz, campaignId };
}
