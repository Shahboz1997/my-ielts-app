/**
 * Static C1/C2 synonym maps for IELTS Writing lexical upgrade (fallback + merge with API).
 * Keys are lowercase headwords; match with word-boundary search in the essay.
 */

/** @typedef {{ c1: string[], c2: string[] }} LexicalEntry */

/** @type {Record<string, LexicalEntry>} */
export const TASK1_LEXICAL = {
  increase: { c1: ['rise', 'grow'], c2: ['surge', 'soar', 'climb sharply'] },
  decrease: { c1: ['decline', 'drop'], c2: ['plummet', 'dip', 'fall markedly'] },
  show: { c1: ['indicate', 'reveal'], c2: ['illustrate', 'demonstrate'] },
  'go up': { c1: ['rise', 'increase'], c2: ['escalate', 'edge higher'] },
  'go down': { c1: ['fall', 'decrease'], c2: ['slide', 'trend downward'] },
  big: { c1: ['substantial', 'significant'], c2: ['considerable', 'marked'] },
  small: { c1: ['modest', 'minor'], c2: ['marginal', 'slight'] },
  'a lot': { c1: ['considerably', 'significantly'], c2: ['substantially', 'markedly'] },
  about: { c1: ['approximately', 'around'], c2: ['roughly', 'in the region of'] },
  get: { c1: ['reach', 'attain'], c2: ['amount to', 'stand at'] },
  change: { c1: ['shift', 'alter'], c2: ['fluctuate', 'vary'] },
  stable: { c1: ['unchanged', 'steady'], c2: ['plateau', 'level off'] },
  peak: { c1: ['reach a high', 'top out'], c2: ['hit a peak', 'crest'] },
  compare: { c1: ['contrast', 'relative to'], c2: ['by comparison', 'vis-à-vis'] },
  number: { c1: ['figure', 'statistic'], c2: ['metric', 'data point'] },
  people: { c1: ['individuals', 'respondents'], c2: ['the population surveyed', 'participants'] },
  start: { c1: ['begin', 'commence'], c2: ['initiate', 'open at'] },
  end: { c1: ['finish', 'conclude'], c2: ['close at', 'terminate'] },
  high: { c1: ['elevated', 'peak'], c2: ['a record high', 'the upper end'] },
  low: { c1: ['minimal', 'bottom'], c2: ['a trough', 'the lower end'] },
};

/** @type {Record<string, LexicalEntry>} */
export const TASK2_LEXICAL = {
  good: { c1: ['beneficial', 'positive'], c2: ['advantageous', 'conducive to'] },
  bad: { c1: ['harmful', 'negative'], c2: ['detrimental', 'adverse'] },
  big: { c1: ['substantial', 'significant'], c2: ['considerable', 'profound'] },
  small: { c1: ['minor', 'limited'], c2: ['negligible', 'marginal'] },
  things: { c1: ['factors', 'aspects'], c2: ['elements', 'dimensions'] },
  stuff: { c1: ['material', 'matters'], c2: ['substance', 'affairs'] },
  get: { c1: ['obtain', 'receive'], c2: ['acquire', 'attain'] },
  very: { c1: ['highly', 'extremely'], c2: ['profoundly', 'remarkably'] },
  nowadays: { c1: ['currently', 'in modern society'], c2: ['in the contemporary era', 'at present'] },
  money: { c1: ['funding', 'finance'], c2: ['financial resources', 'capital'] },
  people: { c1: ['individuals', 'citizens'], c2: ['the populace', 'members of society'] },
  think: { c1: ['believe', 'argue'], c2: ['contend', 'maintain'] },
  believe: { c1: ['hold that', 'argue'], c2: ['maintain', 'assert'] },
  happy: { c1: ['content', 'satisfied'], c2: ['fulfilled', 'at ease'] },
  sad: { c1: ['unhappy', 'distressed'], c2: ['disheartened', 'despondent'] },
  important: { c1: ['crucial', 'vital'], c2: ['pivotal', 'paramount'] },
  problem: { c1: ['issue', 'challenge'], c2: ['predicament', 'hurdle'] },
  help: { c1: ['assist', 'support'], c2: ['facilitate', 'bolster'] },
  need: { c1: ['require', 'necessitate'], c2: ['demand', 'call for'] },
  want: { c1: ['wish', 'desire'], c2: ['aspire to', 'seek to'] },
  many: { c1: ['numerous', 'a wide range of'], c2: ['a plethora of', 'myriad'] },
  some: { c1: ['certain', 'several'], c2: ['a subset of', 'a proportion of'] },
  also: { c1: ['furthermore', 'moreover'], c2: ['in addition', 'equally'] },
  because: { c1: ['since', 'as'], c2: ['owing to', 'on account of'] },
  so: { c1: ['therefore', 'thus'], c2: ['consequently', 'hence'] },
};

/** Fallback weak words when API returns nothing (Task 2–oriented; Task 1 uses map keys). */
export const WEAK_WORDS_FALLBACK = [
  'good', 'bad', 'big', 'small', 'things', 'stuff', 'get', 'very',
  'nowadays', 'money', 'people', 'think', 'believe', 'increase', 'show', 'about',
];
