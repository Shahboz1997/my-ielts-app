'use client';

import WordListPanel from '@/components/WordListPanel';
import LinkingWordsSection from '@/components/writer/linguistic/LinkingWordsSection';
import WordRepetitionSection from '@/components/writer/linguistic/WordRepetitionSection';
import PlagiarismAlert from '@/components/writer/linguistic/PlagiarismAlert';
import LexicalUpgradeSection from '@/components/writer/linguistic/LexicalUpgradeSection';

function insightCardShell(darkMode) {
  return `flex min-h-0 min-w-0 flex-col overflow-visible rounded-2xl border shadow-sm ring-1 ring-slate-900/[0.04] transition-[box-shadow,border-color] duration-300 hover:shadow-md sm:rounded-3xl dark:ring-white/[0.06] xl:h-full xl:overflow-hidden xl:max-h-[min(72vh,42rem)] ${
    darkMode
      ? 'border-slate-800 bg-slate-900 hover:border-slate-700'
      : 'border-slate-200/90 bg-white hover:border-indigo-200/60'
  }`;
}

const insightScrollBody =
  'flex flex-col xl:feedback-card-scroll xl:custom-scrollbar xl:min-h-0 xl:flex-1 xl:overflow-y-auto xl:overscroll-y-contain';

function insightHeaderShell(accent) {
  const gradients = {
    indigo:
      'border-slate-100 bg-gradient-to-br from-indigo-50/90 via-white to-slate-50/50 dark:border-white/5 dark:from-indigo-950/40 dark:via-slate-900 dark:to-slate-900/80',
    violet:
      'border-slate-100 bg-gradient-to-br from-violet-50/80 via-white to-amber-50/30 dark:border-white/5 dark:from-violet-950/35 dark:via-slate-900 dark:to-amber-950/20',
  };
  return `border-b px-4 py-4 sm:px-6 sm:py-5 ${gradients[accent]}`;
}

export default function LinguisticInsightsPanel({
  activeTab,
  darkMode,
  activeResult,
  triggerHighlight,
  insertLinkingWord,
  playClickSound,
  searchState,
  replaceNext,
  mergedLexicalUpgrade,
  handleApplyAllUpgrades,
  setEssayT1,
  setEssayT2,
  essayT1,
  essayT2,
}) {
  const linkingScore = activeResult.analysis?.linking_words?.score;

  return (
    <div className="min-w-0 w-full">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3 px-0.5 sm:mb-5">
        <div className="min-w-0">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">
            Language layer
          </p>
          <h4 className="mt-1 text-sm font-extrabold tracking-tight text-slate-900 dark:text-slate-100 sm:text-base">
            Cohesion & vocabulary
          </h4>
        </div>
        <p className="max-w-xs text-right text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
          Linking, repetition, and lexical upgrades side by side.
        </p>
      </div>

      <div className="grid w-full min-w-0 grid-cols-1 gap-4 sm:gap-5 xl:grid-cols-2 xl:items-stretch xl:auto-rows-fr">
        <section className={insightCardShell(darkMode)}>
          <header className={`${insightHeaderShell('indigo')} shrink-0`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400">
                  Analysis
                </p>
                <h5 className="mt-1 text-base font-extrabold tracking-tight text-slate-900 dark:text-slate-100 sm:text-lg">
                  Linguistic Insights
                </h5>
                <p className="mt-1 max-w-md text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                  Linking words and repetition alerts for your draft.
                </p>
              </div>
              {linkingScore != null && (
                <span className="shrink-0 rounded-xl border border-amber-200/80 bg-white/90 px-3 py-1.5 text-[11px] font-bold tabular-nums text-amber-900 shadow-sm backdrop-blur-sm dark:border-amber-800/50 dark:bg-amber-950/50 dark:text-amber-200">
                  CC flow {linkingScore}/9
                </span>
              )}
            </div>
          </header>

          <div className={`${insightScrollBody} gap-4 p-4 sm:gap-5 sm:p-6`}>
            <LinkingWordsSection
              activeTab={activeTab}
              activeResult={activeResult}
              triggerHighlight={triggerHighlight}
              insertLinkingWord={insertLinkingWord}
            />

            <WordRepetitionSection
              activeTab={activeTab}
              darkMode={darkMode}
              activeResult={activeResult}
              triggerHighlight={triggerHighlight}
              playClickSound={playClickSound}
              searchState={searchState}
              replaceNext={replaceNext}
            />

            <WordListPanel variant="inline" />

            <PlagiarismAlert activeResult={activeResult} />
          </div>
        </section>

        <LexicalUpgradeSection
          activeTab={activeTab}
          darkMode={darkMode}
          mergedLexicalUpgrade={mergedLexicalUpgrade}
          handleApplyAllUpgrades={handleApplyAllUpgrades}
          replaceNext={replaceNext}
          setEssayT1={setEssayT1}
          setEssayT2={setEssayT2}
          essayT1={essayT1}
          essayT2={essayT2}
          cardClassName={insightCardShell(darkMode)}
          headerClassName={`${insightHeaderShell('violet')} shrink-0`}
          bodyClassName={`${insightScrollBody} p-4 sm:p-6`}
        />
      </div>
    </div>
  );
}
