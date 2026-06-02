'use client';

import { CheckCircle } from 'lucide-react';
import ComparisonLab from '@/components/ComparisonLab';
import CreditsExhaustedCallout from '@/components/CreditsExhaustedCallout';
import SuggestedRewriteKaraoke from '@/components/dashboard/SuggestedRewriteKaraoke';

export default function WriterComparisonSection({
  activeResult,
  activeAnalyzeLoading,
  activeTab,
  darkMode,
  showCreditsExhausted,
  onContactSupport,
  karaokeAudio,
}) {
  const showRewrite = Boolean(activeResult && !activeAnalyzeLoading && activeResult.suggested_rewrite);

  return (
    <>
      {showRewrite && (
        <div className="relative w-full min-w-0 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="mb-4 flex w-full items-center gap-3 sm:mb-6">
            <CheckCircle className="h-5 w-5 shrink-0 text-green-600 dark:text-green-400" strokeWidth={1.5} />
            <h4 className="shrink-0 text-sm font-extrabold uppercase tracking-[0.2em] text-slate-800 dark:text-slate-100 sm:text-base">
              Comparison Lab
            </h4>
            <div className="h-[1px] flex-1 bg-slate-200 dark:bg-slate-700" aria-hidden />
          </div>
          <ComparisonLab
            activeTab={activeTab}
            activeResult={activeResult}
            darkMode={darkMode}
            className="w-full"
          />
        </div>
      )}

      {showCreditsExhausted && (
        <CreditsExhaustedCallout className="w-full" onContactSupport={onContactSupport} />
      )}

      {showRewrite && (
        <SuggestedRewriteKaraoke
          fullBleedLayout
          suggestedRewrite={activeResult.suggested_rewrite}
          wordTimestamps={karaokeAudio.wordTimestamps}
          audioRef={karaokeAudio.audioRef}
          audioUrl={karaokeAudio.audioUrl}
          audioDuration={karaokeAudio.audioDuration}
          isAudioLoading={karaokeAudio.isAudioLoading}
          isPlaying={karaokeAudio.isPlaying}
          audioProgress={karaokeAudio.audioProgress}
          audioTime={karaokeAudio.audioTime}
          audioError={karaokeAudio.audioError}
          onGenerateAudio={karaokeAudio.onGenerateAudio}
          onTogglePlay={karaokeAudio.onTogglePlay}
          onSeek={karaokeAudio.onSeek}
          formatTime={karaokeAudio.formatTime}
        />
      )}
    </>
  );
}
