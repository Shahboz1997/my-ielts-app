/**
 * Curated study materials for /study-plan weak-area recommendations.
 */
import studyResourcesSeed from '../../data/studyResources.json';
import { labelSubtopic } from '@/lib/errorSubtopics.js';

const CRITERION_BADGE = {
  ta: { en: 'TA / TR', ru: 'TA / TR' },
  cc: { en: 'CC', ru: 'CC' },
  lr: { en: 'LR', ru: 'LR' },
  gra: { en: 'GRA', ru: 'GRA' },
};

const CRITERION_LABEL = {
  ta: { en: 'Task achievement', ru: 'Выполнение задания' },
  cc: { en: 'Coherence', ru: 'Связность' },
  lr: { en: 'Lexical resource', ru: 'Лексика' },
  gra: { en: 'Grammar', ru: 'Грамматика' },
};

function catalog() {
  return studyResourcesSeed && typeof studyResourcesSeed === 'object' ? studyResourcesSeed : {};
}

function localizeResource(r, locale) {
  const isRu = locale === 'ru';
  return {
    title: isRu && r.titleRu ? r.titleRu : r.title,
    url: r.url,
    source: r.source || '',
    durationMin: r.durationMin ?? null,
    kind: r.kind || 'read',
    inApp: r.inApp || null,
  };
}

function reasonForCriterion(key, avg, n, locale) {
  const isRu = locale === 'ru';
  const label = CRITERION_LABEL[key];
  const name = isRu ? label?.ru : label?.en;
  if (avg == null) return isRu ? `Рекомендация по критерию: ${name}.` : `Suggested for: ${name}.`;
  const band = Number(avg).toFixed(1);
  const suffix = n != null ? (isRu ? ` (среднее ${band}, n=${n})` : ` (avg ${band}, n=${n})`) : ` (${band})`;
  return isRu
    ? `Ваш самый слабый критерий — ${name}${suffix}.`
    : `Your weakest criterion is ${name}${suffix}.`;
}

function reasonForSubtopic(key, count, locale) {
  const isRu = locale === 'ru';
  const label = labelSubtopic(key, locale);
  return isRu
    ? `Частая подтема в отчётах: «${label}» (${count} раз).`
    : `Frequent issue sub-topic: “${label}” (${count}×).`;
}

/**
 * @param {object} params
 * @param {string[]} params.weakCriteriaKeys
 * @param {{ key: string, label: string, value?: number, n?: number }[]} params.criteriaSeries
 * @param {{ key: string, label: string, count: number }[]} params.subtopicSeries
 * @param {Record<string, number>} params.errorTypes
 * @param {boolean} params.hasGtLetters
 * @param {'en'|'ru'} params.locale
 */
export function buildStudyRecommendations(params) {
  const locale = params.locale === 'ru' ? 'ru' : 'en';
  const cat = catalog();
  const seen = new Set();
  const out = [];
  let priority = 0;

  const push = (item) => {
    if (!item?.url || seen.has(item.url)) return;
    seen.add(item.url);
    out.push({ ...item, priority: priority++ });
  };

  const avgByKey = Object.fromEntries(
    (params.criteriaSeries || []).map((r) => [r.key, { value: r.value, n: r.n }])
  );

  for (const key of params.weakCriteriaKeys || []) {
    const list = cat.criteria?.[key] || [];
    const meta = avgByKey[key];
    for (const raw of list.slice(0, 2)) {
      const loc = localizeResource(raw, locale);
      push({
        ...loc,
        criterionKey: key,
        subtopicKey: null,
        badgeLabel: CRITERION_BADGE[key]?.[locale] || key.toUpperCase(),
        reason: reasonForCriterion(key, meta?.value, meta?.n, locale),
      });
    }
  }

  for (const row of (params.subtopicSeries || []).slice(0, 3)) {
    const list = cat.subtopics?.[row.key] || [];
    for (const raw of list.slice(0, 1)) {
      const loc = localizeResource(raw, locale);
      push({
        ...loc,
        criterionKey: null,
        subtopicKey: row.key,
        badgeLabel: locale === 'ru' ? 'Подтема' : 'Sub-topic',
        reason: reasonForSubtopic(row.key, row.count, locale),
      });
    }
  }

  if (params.hasGtLetters && Array.isArray(cat.gtLetter)) {
    for (const raw of cat.gtLetter.slice(0, 1)) {
      const loc = localizeResource(raw, locale);
      push({
        ...loc,
        criterionKey: 'ta',
        subtopicKey: 'register',
        badgeLabel: 'GT',
        reason:
          locale === 'ru'
            ? 'У вас есть проверки GT Letter — материалы по формальным письмам.'
            : 'You have GT letter checks — formal letter resources.',
      });
    }
  }

  out.sort((a, b) => a.priority - b.priority);
  return out.slice(0, 10);
}

/**
 * @param {string[]} weakKeys
 * @param {{ key: string, label: string, count: number }[]} subtopicSeries
 * @param {'en'|'ru'} locale
 */
export function buildWeeklySteps(weakKeys, subtopicSeries, locale) {
  const isRu = locale === 'ru';
  const crit = weakKeys?.[0];
  const sub = subtopicSeries?.[0];
  const critName =
    crit === 'cc'
      ? isRu
        ? 'связность'
        : 'cohesion'
      : crit === 'lr'
        ? isRu
          ? 'лексику'
          : 'vocabulary'
        : crit === 'gra'
          ? isRu
            ? 'грамматику'
            : 'grammar'
          : isRu
            ? 'выполнение задания'
            : 'task response';
  const subLabel = sub?.label || (isRu ? 'слабую подтему' : 'your weak sub-topic');

  if (!crit && !sub) {
    return isRu
      ? [{ step: 1, text: 'Сделайте 2 проверки в STRATUM, чтобы появился план.' }]
      : [{ step: 1, text: 'Submit 2 checks in STRATUM to unlock a plan.' }];
  }

  return [
    {
      step: 1,
      text: isRu
        ? `Прочитайте 1 материал по ${critName} (5–10 мин).`
        : `Read one resource on ${critName} (5–10 min).`,
    },
    {
      step: 2,
      text: isRu
        ? `Напишите эссе в Task 2 и проверьте фокус на: ${subLabel}.`
        : `Write one Task 2 essay focusing on: ${subLabel}.`,
    },
    {
      step: 3,
      text: isRu
        ? `Повторная проверка — сравните баллы по критериям здесь.`
        : `Run another check and compare criterion bands here.`,
    },
  ];
}
