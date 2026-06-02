'use client';

import { motion } from 'framer-motion';
import { Clock, Pause, Play, Trash2 } from 'lucide-react';
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
  return (
    <div className="flex flex-col gap-6 mb-8">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-6 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between lg:justify-start w-full lg:w-auto gap-4 shrink-0 flex-wrap">
          <div className="flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
            {['Task 1', 'Task 2'].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-medium tracking-tight transition-all ${
                  activeTab === tab
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          {activeTab === 'Task 1' && (
            <div className="flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setTask1Kind('academic')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  task1Kind === 'academic' ? 'bg-indigo-600 text-white' : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Academic
              </button>
              <button
                type="button"
                onClick={() => {
                  setTask1Kind('gt_letter');
                  setImageUploadError(null);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  task1Kind === 'gt_letter' ? 'bg-teal-600 text-white' : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                GT Letter
              </button>
            </div>
          )}
          <div className="lg:hidden">
            <button
              type="button"
              onClick={onClearDraft}
              className="p-2 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200 dark:border-slate-700 rounded-xl transition-all"
              title="Clear Draft"
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
