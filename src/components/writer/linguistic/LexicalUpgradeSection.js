'use client';

import LexicalUpgradePanel from '@/components/LexicalUpgradePanel';

export default function LexicalUpgradeSection({
  activeTab,
  darkMode,
  mergedLexicalUpgrade,
  handleApplyAllUpgrades,
  replaceNext,
  setEssayT1,
  setEssayT2,
  essayT1,
  essayT2,
  cardClassName,
  headerClassName,
  bodyClassName,
}) {
  const shell =
    cardClassName ||
    `flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border shadow-sm sm:rounded-3xl ${
      darkMode ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'
    }`;
  const header =
    headerClassName ||
    'shrink-0 border-b border-slate-100 px-4 py-4 dark:border-white/5 sm:px-6 sm:py-5';
  const body =
    bodyClassName ||
    'feedback-card-scroll custom-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-y-contain p-4 sm:p-6';

  return (
    <section className={shell}>
      <header className={header}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-violet-600 dark:text-violet-400">
              Vocabulary
            </p>
            <h5 className="mt-1 text-base font-extrabold tracking-tight text-slate-900 dark:text-slate-100 sm:text-lg">
              Lexical Upgrade
            </h5>
            <p className="mt-1 max-w-md text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              Weak Band 5–6 words from your essay → C1/C2 synonyms (Band 7–9) with example sentences.
            </p>
          </div>
          {mergedLexicalUpgrade.length > 0 && (
            <button
              type="button"
              onClick={handleApplyAllUpgrades}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-3.5 py-2 text-[11px] font-semibold text-white shadow-md shadow-amber-500/25 transition-all hover:from-amber-600 hover:to-orange-600 active:scale-[0.98]"
              title="Replace first occurrence of each weak word with the top C2/C1 synonym"
            >
              <span aria-hidden>✦</span>
              Apply all
            </button>
          )}
        </div>
      </header>

      <div className={body}>
        <LexicalUpgradePanel
          embedded
          rows={mergedLexicalUpgrade}
          onReplaceWord={(word, syn) => replaceNext(word, syn)}
          setUserText={(text) => (activeTab === 'Task 1' ? setEssayT1(text) : setEssayT2(text))}
          userText={activeTab === 'Task 1' ? essayT1 : essayT2}
          taskType={activeTab === 'Task 1' ? 'task1' : 'task2'}
        />
      </div>
    </section>
  );
}
