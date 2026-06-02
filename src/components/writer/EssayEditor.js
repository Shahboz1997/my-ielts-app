'use client';

import { ChevronDown } from 'lucide-react';

export const SHARED_EDITOR_STYLES = {
  fontFamily: 'inherit',
  fontSize: '16px',
  lineHeight: '1.8',
  padding: '22px 14px 22px 14px',
  whiteSpace: 'pre-wrap',
  overflowWrap: 'break-word',
  wordBreak: 'break-word',
  fontVariantLigatures: 'none',
  boxSizing: 'border-box',
};

export default function EssayEditor({
  activeTab,
  darkMode,
  isGtLetter,
  isPromptOpen,
  setIsPromptOpen,
  promptValue,
  onPromptChange,
  essayValue,
  onEssayChange,
  currentWordCount,
  targetWords,
  highlightRef,
  editorRef,
  onScroll,
  renderColoredText,
  onFocus,
  onBlur,
  playClickSound,
}) {
  return (
    <>
      <div className="mb-6 animate-in fade-in slide-in-from-top-4 duration-500">
        <div
          className={`p-1.5 sm:p-2 rounded-xl border transition-all duration-300 ${
            isPromptOpen
              ? darkMode
                ? 'border-slate-800 bg-slate-900/40 shadow-sm'
                : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 shadow-sm'
              : 'border-transparent bg-transparent opacity-50 hover:opacity-100'
          }`}
        >
          <div
            onClick={() => setIsPromptOpen(!isPromptOpen)}
            className="flex justify-between items-center cursor-pointer px-1"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setIsPromptOpen(!isPromptOpen);
              }
            }}
          >
            <div className="flex items-center gap-1">
              <span
                className={`text-xs font-semibold tracking-tight transition-colors ${
                  isPromptOpen ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {activeTab} Topic
              </span>
              {!isPromptOpen && <div className="w-0.5 h-0.5 rounded-full bg-indigo-400/50" />}
            </div>
            <ChevronDown
              className={`w-4 h-4 transition-all duration-300 ${
                isPromptOpen ? 'text-indigo-500 rotate-0' : 'text-slate-400 -rotate-180'
              }`}
            />
          </div>

          <div
            className={`grid transition-all duration-500 ease-in-out ${
              isPromptOpen ? 'grid-rows-[1fr] opacity-100 mt-1' : 'grid-rows-[0fr] opacity-0 mt-0'
            }`}
          >
            <div className="overflow-hidden">
              <textarea
                value={promptValue}
                onChange={(e) => {
                  e.target.style.height = 'auto';
                  e.target.style.height = `${e.target.scrollHeight}px`;
                  onPromptChange(e.target.value);
                }}
                ref={(el) => {
                  if (el) {
                    el.style.height = 'auto';
                    el.style.height = `${el.scrollHeight}px`;
                  }
                }}
                className={`w-full bg-transparent outline-none text-[11px] sm:text-[12px] font-medium leading-[1.3] italic resize-none placeholder:text-slate-300 overflow-hidden ${
                  darkMode ? 'text-slate-300' : 'text-slate-500'
                }`}
                placeholder="Enter topic..."
              />
              <div className="flex justify-end pr-1 opacity-20">
                <p className="text-[5px] font-extrabold uppercase tracking-tighter text-slate-500 dark:text-slate-400">
                  Essential
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex min-w-0 w-full flex-col gap-2 sm:flex-row sm:items-stretch sm:gap-3">
        <div
          className={`relative min-w-0 flex-1 overflow-hidden rounded-2xl sm:rounded-3xl transition-all duration-300 group ${
            darkMode ? 'bg-slate-900/50 border border-slate-800' : 'bg-white shadow-sm border-0'
          }`}
        >
          <div className="absolute top-0 left-0 right-0 z-50 h-[3px] bg-slate-200 dark:bg-slate-800">
            <div
              className={`h-full transition-all duration-700 ease-out ${
                currentWordCount < targetWords
                  ? 'bg-gradient-to-r from-indigo-500 to-slate-400'
                  : 'bg-gradient-to-r from-green-500 to-emerald-400'
              }`}
              style={{ width: `${Math.min(100, (currentWordCount / targetWords) * 100)}%` }}
            />
          </div>
          <div
            ref={highlightRef}
            className={`absolute inset-0 z-0 pointer-events-none select-none overflow-hidden text-slate-900 dark:text-slate-100 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden ${
              darkMode ? '[color-scheme:dark]' : ''
            }`}
            style={{
              ...SHARED_EDITOR_STYLES,
              width: '100%',
              minHeight: '320px',
              display: 'block',
              border: '1px solid transparent',
              fontVariantLigatures: 'none',
              letterSpacing: 'normal',
              WebkitFontSmoothing: 'antialiased',
            }}
          >
            {renderColoredText()}
          </div>
          <textarea
            ref={editorRef}
            data-stratum-essay-input
            value={essayValue}
            onChange={(e) => {
              playClickSound?.();
              e.target.style.height = 'auto';
              const nextHeight = Math.max(320, e.target.scrollHeight);
              e.target.style.height = `${nextHeight}px`;
              if (highlightRef.current) {
                highlightRef.current.style.height = `${nextHeight}px`;
              }
              onEssayChange(e.target.value);
            }}
            onFocus={(e) => {
              onFocus?.(e);
              e.target.style.height = 'auto';
              e.target.style.height = `${Math.max(320, e.target.scrollHeight)}px`;
            }}
            onBlur={() => onBlur?.()}
            onScroll={onScroll}
            spellCheck="false"
            placeholder={isGtLetter ? 'Dear Sir or Madam,\n\nI am writing to...' : 'Begin your essay...'}
            className={`relative z-10 w-full min-h-[320px] bg-transparent outline-none resize-none overflow-hidden transition-colors duration-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 ${
              darkMode ? 'caret-indigo-400 selection:bg-indigo-500/30' : 'caret-indigo-600 selection:bg-indigo-200/50'
            }`}
            style={{
              ...SHARED_EDITOR_STYLES,
              float: 'left',
              lineHeight: '1.8',
              WebkitFontSmoothing: 'antialiased',
              border: '1px solid transparent',
              color: 'transparent',
              caretColor: darkMode ? '#ffffff' : '#000000',
            }}
          />
        </div>
        <div
          role="status"
          aria-live="polite"
          aria-label={`Word count ${currentWordCount} of ${targetWords}`}
          className={`flex shrink-0 flex-row items-center justify-center gap-3 rounded-xl border px-3 py-2 sm:w-[3.25rem] sm:flex-col sm:gap-1.5 sm:self-stretch sm:px-1.5 sm:py-4 sm:pt-5 ${
            darkMode ? 'border-slate-700/80 bg-slate-900/70' : 'border-slate-200/90 bg-slate-50/90'
          }`}
        >
          <div
            className={`h-2 w-2 shrink-0 rounded-full sm:mb-0 ${
              currentWordCount < targetWords ? 'bg-orange-500' : 'bg-green-500 animate-pulse'
            }`}
          />
          <div className="flex items-baseline gap-1.5 sm:flex-col sm:items-center sm:gap-0 sm:leading-none">
            <span className="text-base font-extrabold tabular-nums tracking-tight text-slate-900 dark:text-slate-100 sm:text-[15px]">
              {currentWordCount}
            </span>
            <span className="text-slate-400 dark:text-slate-500 sm:hidden">/</span>
            <div className="hidden h-px w-6 bg-slate-400/25 sm:block" />
            <span className="text-[10px] font-bold tracking-tighter text-slate-600 dark:text-slate-400 sm:text-[9px]">
              {targetWords}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
