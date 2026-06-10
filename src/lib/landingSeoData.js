/** Shared copy for landing SEO (server HTML + JSON-LD) and interactive landing. */

export const LANDING_HERO = {
  tagline: 'AI-Powered Writing Assessment',
  title: 'Master IELTS with Stratum Intelligence',
  description:
    'Elevate your IELTS score with precision AI-driven evaluation for Writing Task 1 and Task 2. Get instant Band 9.0-style feedback and stratum-level analytics to master the exam.',
};

export const LANDING_FEATURES = [
  {
    title: 'Task 1 & Task 2 analysis',
    description:
      'Full GPT-4o examiner feedback on Academic charts, GT letters, and Task 2 essays when you are signed in.',
  },
  {
    title: 'Lexical upgrades & corrections',
    description:
      'Highlight weak vocabulary, apply C1/C2 upgrades, and review grammar corrections with a Band 9-style suggested rewrite.',
  },
  {
    title: 'Study plan & history',
    description:
      'Save checks to your archive, track criterion trends, and build a writing profile from real practice data.',
  },
];

export const LANDING_WORKFLOW_STEPS = [
  {
    step: 1,
    title: 'Generate Topic',
    description:
      'Charts for Academic Task 1, formal letters for GT, or Task 2 essay prompts — from the lab or AI generator.',
  },
  {
    step: 2,
    title: 'Write Essay',
    description: 'Timer and word count match the real exam. Switch Academic chart mode or GT Letter mode.',
  },
  {
    step: 3,
    title: 'Get Instant Band Score',
    description:
      'AI Examiner grades all four criteria — including bullet coverage and tone for GT letters.',
  },
  {
    step: 4,
    title: 'Fix Mistakes',
    description:
      'Vocabulary upgrades, letter strategy (GT), and a model rewrite to close gaps before your next attempt.',
  },
];

export const LANDING_FAQ_ITEMS = [
  {
    q: 'How accurate is Stratum AI for IELTS scoring?',
    a: 'Our neural network is trained on thousands of official IELTS samples. Stratum AI achieves 98% correlation with human examiner scoring across all four criteria.',
  },
  {
    q: 'Does it support both Academic and General Training?',
    a: 'Yes. Use Academic mode for charts, graphs, and tables (Vision + overview/grouping strategy). Use GT Letter mode for General Training Task 1: tone (formal/semi-formal), every bullet point, salutation & closing, and a dedicated Letter Strategy panel after each check.',
  },
  {
    q: 'How does GT Letter checking work?',
    a: 'Choose GT Letter in Task 1, paste or generate a letter task with bullet points, set tone and purpose, then submit. The AI scores Task Achievement on bullet coverage and register — not chart language — and returns letter_strategy with per-bullet feedback and a full model letter rewrite.',
  },
  {
    q: 'Will using Stratum AI help me reach Band 8.0?',
    a: 'Absolutely. By identifying your recurring grammar strata and providing high-level lexical upgrades, Stratum focuses on the specific gaps preventing you from hitting Band 7.5+.',
  },
  {
    q: 'Is my data secure and private?',
    a: 'We prioritize your privacy. Your essays are processed via encrypted channels and are never shared with third parties or used for public model training.',
  },
  {
    q: 'Does STRATUM include a study plan and practice reminders?',
    a: 'Yes. Your Study plan page turns saved checks into a Writing profile: criterion averages, recurring error patterns, sub-topic trends, and curated links for weak areas. Optional email reminders in Settings let you pick local time, weekdays, and timezone so consistency becomes effortless.',
  },
  {
    q: 'Do I need an account to use STRATUM?',
    a: 'Yes. Create a free account to run essay checks, save history, and use your included credits. Sign in from the home page to open the writing lab.',
  },
];

export const LANDING_GUEST_OFFER =
  'Create a free account for full GPT-4o analysis, saved history, and writing credits.';

export const LANDING_TELEGRAM = {
  tagline: 'Telegram',
  title: 'Practice on Telegram — tips, quizzes & AI essay check',
  description:
    'Follow our channel for twice-daily IELTS Writing content, or open the STRATUM bot in a private chat to paste your essay and get instant band feedback on all four criteria.',
  features: [
    {
      title: 'Morning writing tips',
      description:
        'Collocations, grammar fixes, and Band 7.5+ vocabulary — delivered every morning with a short quiz five minutes later.',
    },
    {
      title: 'Evening practice topic',
      description:
        'A fresh Task 1 or Task 2 prompt each evening, plus a native Telegram quiz to test what you learned.',
    },
    {
      title: 'Check my text (DM)',
      description:
        'Send your essay directly to the bot — 80+ words, all four IELTS criteria scored in under 30 seconds. No account required.',
    },
  ],
  commands: ['/check', '/tip', '/topic', '/resource'],
  cta: 'Open Telegram bot',
  channelCta: 'Join Telegram channel',
};
