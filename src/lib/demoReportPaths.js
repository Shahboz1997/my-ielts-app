/** Client-safe evergreen demo URLs (no fs). Keep in sync with content/demo/catalog.json */

export const DEMO_PATHS = {
  flagship: '/demo/flagship-writing',
  task2Weak: '/demo/task2-band-55',
  task2Strong: '/demo/task2-band-75',
  task1Academic: '/demo/task1-academic',
};

export const DEMO_LANDING_SAMPLES = [
  {
    href: DEMO_PATHS.task2Weak,
    label: 'Task 2 · Band 5.5',
    blurb: 'Weak draft with dense corrections and lexical upgrades.',
    band: '5.5',
  },
  {
    href: DEMO_PATHS.task2Strong,
    label: 'Task 2 · Band 7.5',
    blurb: 'Stronger essay — criterion notes plus Band 9-style rewrite.',
    band: '7.5',
  },
  {
    href: DEMO_PATHS.task1Academic,
    label: 'Task 1 · Academic',
    blurb: 'Real chart description scored on overview and data grouping.',
    band: '5.0',
  },
];
