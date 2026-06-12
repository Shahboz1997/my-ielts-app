'use client';

import IdeaDevelopmentPanel from '@/components/writer/IdeaDevelopmentPanel';
import CorrectionsList from '@/components/writer/CorrectionsList';
import LinguisticInsightsPanel from '@/components/writer/LinguisticInsightsPanel';
import TaskStrategySection from '@/components/writer/TaskStrategySection';

export default function WriterDetailedAnalysis(props) {
  const {
    activeTab,
    darkMode,
    activeResult,
    activeAnalyzeLoading,
    loadingT1,
    loadingT2,
    isGtLetter,
    appliedCorrections,
    handleReplaceWord,
    speak,
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
  } = props;

  if (!activeResult || activeAnalyzeLoading) return null;

  return (
    <div className="order-3 min-w-0 w-full space-y-6 -mx-0.5 sm:-mx-3.5 lg:-mx-[22px] xl:-mx-7.5 xl:col-span-2 xl:col-start-1 xl:row-start-2">
      <IdeaDevelopmentPanel activeTab={activeTab} activeResult={activeResult} darkMode={darkMode} />
      <CorrectionsList
        activeTab={activeTab}
        darkMode={darkMode}
        loadingT1={loadingT1}
        loadingT2={loadingT2}
        activeResult={activeResult}
        appliedCorrections={appliedCorrections}
        handleReplaceWord={handleReplaceWord}
        speak={speak}
      />
      <LinguisticInsightsPanel
        activeTab={activeTab}
        darkMode={darkMode}
        activeResult={activeResult}
        triggerHighlight={triggerHighlight}
        insertLinkingWord={insertLinkingWord}
        playClickSound={playClickSound}
        searchState={searchState}
        replaceNext={replaceNext}
        mergedLexicalUpgrade={mergedLexicalUpgrade}
        handleApplyAllUpgrades={handleApplyAllUpgrades}
        setEssayT1={setEssayT1}
        setEssayT2={setEssayT2}
        essayT1={essayT1}
        essayT2={essayT2}
      />
      <TaskStrategySection
        activeTab={activeTab}
        activeResult={activeResult}
        darkMode={darkMode}
        isGtLetter={isGtLetter}
      />
    </div>
  );
}
