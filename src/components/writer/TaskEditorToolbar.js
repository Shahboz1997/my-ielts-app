'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronDown, Clock, Pause, Play, Trash2 } from 'lucide-react';
import {
  TASK_TYPE_OPTIONS,
  findTaskTypeOption,
  resolveTaskTypeOptionId,
} from '@/lib/writer/constants';
import { formatTime } from '@/lib/writer/wordCount';

const TYPE_STYLES = {
  gt_letter: {
    select: 'border-teal-200/80 bg-teal-50/50 text-teal-900 ring-teal-500/20 dark:border-teal-800/50 dark:bg-teal-950/25 dark:text-teal-100',
    optionSelected:
      'border-l-2 border-teal-500 bg-teal-50/50 text-teal-700 dark:border-teal-400 dark:bg-teal-950/40 dark:text-teal-300',
    optionIcon: 'text-teal-600 dark:text-teal-400',
  },
  task2: {
    select: 'border-indigo-200/80 bg-indigo-50/50 text-indigo-900 ring-indigo-500/20 dark:border-indigo-800/50 dark:bg-indigo-950/25 dark:text-indigo-100',
    optionSelected:
      'border-l-2 border-indigo-500 bg-indigo-50/50 text-indigo-600 dark:border-indigo-400 dark:bg-indigo-950/40 dark:text-indigo-400',
    optionIcon: 'text-indigo-600 dark:text-indigo-400',
  },
  default: {
    select: 'border-indigo-200/80 bg-indigo-50/50 text-indigo-900 ring-indigo-500/20 dark:border-indigo-800/50 dark:bg-indigo-950/25 dark:text-indigo-100',
    optionSelected:
      'border-l-2 border-indigo-500 bg-indigo-50/50 text-indigo-600 dark:border-indigo-400 dark:bg-indigo-950/40 dark:text-indigo-400',
    optionIcon: 'text-indigo-600 dark:text-indigo-400',
  },
};

const OPTION_ACCENT_STYLES = {
  task2: TYPE_STYLES.task2,
  academic_t1: TYPE_STYLES.default,
  gt_t1: TYPE_STYLES.gt_letter,
};

function resolveTypeStyles(selectedId, task1Kind) {
  if (task1Kind === 'gt_letter') return TYPE_STYLES.gt_letter;
  if (selectedId === 'task2') return TYPE_STYLES.task2;
  return TYPE_STYLES.default;
}

export default function TaskEditorToolbar({
  activeTab,
  setActiveTab,
  task1Kind,
  setTask1Kind,
  setImageUploadError,
  onClearDraft,
  timeLeft,
  timerActive,
  setTimerActive,
}) {
  const [isTypeOpen, setIsTypeOpen] = useState(false);
  const typeMenuRef = useRef(null);

  const selectedId = resolveTaskTypeOptionId(activeTab, task1Kind);
  const selectedOption = findTaskTypeOption(selectedId);
  const typeStyles = resolveTypeStyles(selectedId, selectedOption.task1Kind);

  useEffect(() => {
    if (!isTypeOpen) return undefined;

    const handlePointerDown = (event) => {
      if (typeMenuRef.current && !typeMenuRef.current.contains(event.target)) {
        setIsTypeOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setIsTypeOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isTypeOpen]);

  const handleTaskTypeChange = (optionId) => {
    const option = findTaskTypeOption(optionId);
    setActiveTab(option.tab);
    if (option.task1Kind) {
      setTask1Kind(option.task1Kind);
      if (option.task1Kind === 'gt_letter') setImageUploadError(null);
    }
  };

  const isUrgent = timeLeft <= 60 && timeLeft > 0 && timerActive;

  return (
    <div className="flex flex-col gap-5 sm:gap-6 mb-6 sm:mb-8">
      <div className="flex flex-col gap-5 sm:gap-6 pb-5 sm:pb-6 border-b border-slate-200/70 dark:border-slate-800/80">
        {/* Question type selector */}
        <label className="block w-full space-y-2">
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
            Question type
          </span>
          <div
            ref={typeMenuRef}
            className={`group relative rounded-2xl border ring-1 transition-all duration-200 hover:shadow-sm focus-within:ring-2 focus-within:ring-indigo-500/30 ${typeStyles.select}`}
          >
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsTypeOpen((open) => !open)}
                aria-expanded={isTypeOpen}
                aria-haspopup="listbox"
                aria-label="Question type"
                className="w-full cursor-pointer bg-transparent px-4 py-3.5 pr-11 text-left text-[15px] font-semibold tracking-tight outline-none transition-all duration-200"
              >
                {selectedOption.label}
              </button>
              <ChevronDown
                className={`pointer-events-none absolute right-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400 transition-transform duration-200 ${
                  isTypeOpen ? 'rotate-180' : ''
                }`}
                aria-hidden
                strokeWidth={2}
              />

              <AnimatePresence>
                {isTypeOpen && (
                  <motion.ul
                    role="listbox"
                    aria-label="Question type options"
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-lg shadow-slate-100/50 divide-y divide-slate-100 dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none"
                  >
                    {TASK_TYPE_OPTIONS.map((opt) => {
                      const isSelected = opt.id === selectedId;
                      const accent = OPTION_ACCENT_STYLES[opt.id] ?? TYPE_STYLES.default;

                      return (
                        <li key={opt.id} role="presentation">
                          <button
                            type="button"
                            role="option"
                            aria-selected={isSelected}
                            onClick={() => {
                              handleTaskTypeChange(opt.id);
                              setIsTypeOpen(false);
                            }}
                            className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium transition-colors duration-150 ${
                              isSelected
                                ? accent.optionSelected
                                : 'border-l-2 border-transparent text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/60'
                            }`}
                          >
                            {isSelected ? (
                              <Check
                                className={`h-4 w-4 shrink-0 ${accent.optionIcon}`}
                                strokeWidth={2.5}
                                aria-hidden
                              />
                            ) : (
                              <span className="h-4 w-4 shrink-0" aria-hidden />
                            )}
                            <span className="min-w-0 flex-1 leading-snug">{opt.label}</span>
                          </button>
                        </li>
                      );
                    })}
                  </motion.ul>
                )}
              </AnimatePresence>
            </div>

            <p className="pointer-events-none border-t border-current/10 px-4 py-2.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              {selectedOption.description}
            </p>
          </div>
        </label>

        {/* Action bar: clear + timer controls */}
        <div className="flex w-full items-center justify-between gap-3">
          {/* Clear draft */}
          <button
            type="button"
            onClick={onClearDraft}
            className="flex h-10 items-center gap-2 rounded-full border border-slate-200/80 bg-slate-50/80 px-3 text-xs font-medium text-slate-500 transition-all duration-200 hover:border-red-200 hover:bg-red-50 hover:text-red-600 active:scale-[0.98] dark:border-slate-700/80 dark:bg-slate-800/50 dark:text-slate-400 dark:hover:border-red-800/60 dark:hover:bg-red-950/30 dark:hover:text-red-400 sm:px-4"
            title="Clear Draft"
            aria-label="Clear draft"
          >
            <Trash2 className="h-4 w-4 shrink-0" strokeWidth={2} />
            <span className="hidden sm:inline">Clear</span>
          </button>

          {/* Timer group — unified pill control */}
          <div className="flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-slate-50/60 p-1 shadow-[inset_0_1px_2px_rgba(15,23,42,0.03)] dark:border-slate-700/80 dark:bg-slate-800/40">
            <motion.div
              animate={isUrgent ? { opacity: [1, 0.85, 1] } : {}}
              transition={{ repeat: Infinity, duration: 1 }}
              className={`flex h-9 items-center gap-2 rounded-full px-3 font-mono text-sm font-medium transition-all duration-200 ${
                isUrgent
                  ? 'bg-red-50 text-red-600 ring-1 ring-red-200/80 dark:bg-red-950/40 dark:text-red-400 dark:ring-red-800/50'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              <Clock
                className={`h-4 w-4 shrink-0 ${isUrgent ? 'text-red-500' : 'text-slate-400'}`}
                strokeWidth={2}
              />
              <span className="tabular-nums tracking-tight">{formatTime(timeLeft)}</span>
            </motion.div>

            <button
              type="button"
              onClick={() => setTimerActive(!timerActive)}
              aria-label={timerActive ? 'Pause timer' : 'Start timer'}
              className={`flex h-9 items-center gap-1.5 rounded-full px-3 text-xs font-semibold transition-all duration-200 active:scale-[0.97] ${
                timerActive
                  ? 'bg-amber-500 text-white shadow-[0_2px_8px_rgba(245,158,11,0.35)] hover:bg-amber-600'
                  : 'bg-indigo-600 text-white shadow-[0_2px_8px_rgba(79,70,229,0.35)] hover:bg-indigo-700'
              }`}
            >
              {timerActive ? (
                <>
                  <Pause className="h-3.5 w-3.5 fill-current" />
                  <span className="hidden min-[380px]:inline">Pause</span>
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5 fill-current" />
                  <span className="hidden min-[380px]:inline">Start</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
