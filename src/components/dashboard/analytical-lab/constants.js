export const FEED_LABEL = { grammar: 'Grammar', lexical: 'Vocabulary', cohesion: 'Cohesion', logic: 'Logic' };

export const ERROR_TYPE_HIGHLIGHT_CLASS = {
  grammar: 'bg-rose-100 dark:bg-rose-900/30 border-b-2 border-rose-500 text-rose-900 dark:text-rose-300 cursor-help',
  logic: 'bg-sky-100 dark:bg-sky-900/30 border-b-2 border-sky-500 text-sky-900 dark:text-sky-300 cursor-help',
  lexical: 'bg-purple-100 dark:bg-purple-900/30 border-b-2 border-purple-500 text-purple-900 dark:text-purple-300 cursor-help',
};

export const ERROR_TYPE_BADGE_CLASS = {
  grammar: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200 border border-rose-200/80 dark:border-rose-800/50',
  logic: 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200 border border-sky-200/80 dark:border-sky-800/50',
  lexical: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-200 border border-purple-200/80 dark:border-purple-800/50',
};

export const ERROR_TYPE_BADGE_LABEL = { grammar: 'Grammar', logic: 'Logic', lexical: 'Vocabulary' };

export const CEFR_LEVELS = [
  { id: 'A1', label: 'A1', barBg: 'bg-slate-400' },
  { id: 'A2', label: 'A2', barBg: 'bg-emerald-500' },
  { id: 'B1', label: 'B1', barBg: 'bg-blue-500' },
  { id: 'B2', label: 'B2', barBg: 'bg-violet-500' },
  { id: 'C1', label: 'C1', barBg: 'bg-orange-500' },
  { id: 'C2', label: 'C2', barBg: 'bg-red-500' },
];

export const CEFR_COLORS = { A1: '#94a3b8', A2: '#10b981', B1: '#3b82f6', B2: '#8b5cf6', C1: '#f97316', C2: '#ef4444' };

export const CEFR_TEXT_CLASS = {
  A1: 'text-slate-400/80',
  A2: 'text-slate-400/80',
  B1: 'text-blue-500/80',
  B2: 'text-violet-500/80',
  C1: 'text-orange-500/80',
  C2: 'text-red-500/80',
};

export const CEFR_LEVEL_LABELS = {
  A1: 'A1 - Beginner',
  A2: 'A2 - Elementary',
  B1: 'B1 - Intermediate',
  B2: 'B2 - Upper Intermediate',
  C1: 'C1 - Advanced',
  C2: 'C2 - Proficiency',
};

export const PLACEHOLDER_CEFR = { A1: 54, A2: 20, B1: 16, B2: 5, C1: 3, C2: 2 };

export const RIGHT_PANEL_TABS = [
  { key: 'vocabulary', label: 'Vocabulary' },
  { key: 'grammar', label: 'Grammar' },
  { key: 'task', labelTask1: 'Task Achievement', labelTask2: 'Task Response' },
  { key: 'coherence', label: 'Coherence' },
];
