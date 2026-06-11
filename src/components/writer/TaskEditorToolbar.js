'use client';

import { motion } from 'framer-motion';
import { ChevronDown, Clock, Pause, Play, Trash2 } from 'lucide-react';
import {
  TASK_TYPE_OPTIONS,
  findTaskTypeOption,
  resolveTaskTypeOptionId,
} from '@/lib/writer/constants';
import { formatTime } from '@/lib/writer/wordCount';

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
  const selectedId = resolveTaskTypeOptionId(activeTab, task1Kind);
  const selectedOption = findTaskTypeOption(selectedId);

  const handleTaskTypeChange = (optionId) => {
    const option = findTaskTypeOption(optionId);
    setActiveTab(option.tab);
    if (option.task1Kind) {
      setTask1Kind(option.task1Kind);
      if (option.task1Kind === 'gt_letter') setImageUploadError(null);
    }
  };

  return (
    <div className="flex flex-col gap-6 mb-8">
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 sm:gap-6 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-start justify-between lg:justify-start w-full lg:w-auto gap-4 shrink-0 flex-wrap">
          <label className="space-y-1.5 block w-full sm:min-w-[280px] sm:max-w-md">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
              Question type
            </span>
            <div className="relative">
              <select
                value={selectedId}
                onChange={(e) => handleTaskTypeChange(e.target.value)}
                aria-label="Question type"
                className={`w-full appearance-none rounded-xl border px-4 py-2.5 pr-10 text-sm font-semibold tracking-tight transition-all outline-none focus:ring-2 focus:ring-indigo-500/40 ${
                  selectedOption.task1Kind === 'gt_letter'
                    ? 'border-teal-200 bg-teal-50/60 text-teal-900 dark:border-teal-800/60 dark:bg-teal-950/30 dark:text-teal-100'
                    : selectedId === 'task2'
                      ? 'border-indigo-200 bg-indigo-50/60 text-indigo-900 dark:border-indigo-800/60 dark:bg-indigo-950/30 dark:text-indigo-100'
                      : 'border-indigo-200 bg-indigo-50/60 text-indigo-900 dark:border-indigo-800/60 dark:bg-indigo-950/30 dark:text-indigo-100'
                }`}
              >
                {TASK_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden
              />
            </div>
            <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              {selectedOption.description}
            </p>
          </label>
          <div className="lg:hidden">
            <button
              type="button"
              onClick={onClearDraft}
              className="p-2 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200 dark:border-slate-700 rounded-xl transition-all"
              title="Clear Draft"
              aria-label="Clear draft"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="hidden lg:flex flex-1 justify-center">
          <button
            type="button"
            onClick={onClearDraft}
            className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all border border-slate-200 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-700 rounded-xl"
          >
            <Trash2 className="w-4 h-4" />
            Clear Draft
          </button>
        </div>

        <div className="flex items-center gap-2 justify-end">
          <motion.div
            animate={timeLeft > 0 && timeLeft <= 60 && timerActive ? { opacity: [1, 0.9, 1] } : {}}
            transition={{ repeat: Infinity, duration: 1 }}
            className={`flex items-center justify-center gap-2 px-3 h-10 min-w-[100px] rounded-xl font-mono text-sm font-medium border transition-all ${
              timeLeft <= 60 && timeLeft > 0
                ? 'text-red-600 border-red-300 bg-red-50 dark:bg-red-950/30 dark:border-red-800'
                : 'text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50'
            }`}
          >
            <Clock
              className={`w-4 h-4 ${timeLeft <= 60 && timeLeft > 0 && timerActive ? 'text-red-600' : 'text-slate-400'}`}
            />
            <span className="tabular-nums">{formatTime(timeLeft)}</span>
          </motion.div>
          <button
            type="button"
            onClick={() => setTimerActive(!timerActive)}
            aria-label={timerActive ? 'Pause timer' : 'Start timer'}
            className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all active:scale-95 ${
              timerActive ? 'bg-amber-500 hover:bg-amber-600 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
          >
            {timerActive ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 ml-0.5 fill-current" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
