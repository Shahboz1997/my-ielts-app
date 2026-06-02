'use client';

import { Download, Trash2 } from 'lucide-react';
import { EmptyState } from '@/components/stratum';
import { resolveArchiveHistoryId } from '@/lib/writer/archiveHistory';

export default function WriterArchivePanel({
  darkMode,
  archive,
  onClearArchive,
  onDownloadEntry,
  onDeleteEntry,
  onReviewEntry,
  onGoToTask1,
}) {
  return (
    <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 px-2 sm:px-0">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-6 sm:mb-10">
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Practice <span className="text-indigo-600 dark:text-indigo-400">History</span>
        </h2>
        <button
          type="button"
          onClick={onClearArchive}
          className="w-full sm:w-auto text-slate-900 dark:text-white font-extrabold text-xs tracking-tight flex items-center justify-center gap-2 px-4 sm:px-6 py-3 rounded-xl sm:rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-700 active:scale-95 shadow-sm"
        >
          <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          Destroy Archive
        </button>
      </header>

      {archive.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-white/5 bg-white/50 dark:bg-white/5 p-6 sm:p-12">
          <EmptyState onPrimaryAction={onGoToTask1} primaryLabel="Generate First Task" />
        </div>
      ) : (
        <div className="grid gap-3 sm:gap-4">
          {archive.map((entry) => (
            <div
              key={entry.id}
              className={`p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2.5rem] border flex flex-col md:flex-row justify-between items-center gap-4 transition-all hover:border-indigo-500 dark:hover:border-indigo-600 ${
                darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 dark:border-slate-800 shadow-sm'
              }`}
            >
              <div className="flex items-center gap-4 sm:gap-6 w-full md:w-auto">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-indigo-600 dark:bg-indigo-500 text-white rounded-xl sm:rounded-2xl flex flex-col items-center justify-center font-extrabold shadow-sm shrink-0">
                  <span className="text-[7px] sm:text-[8px] opacity-60 uppercase leading-none">Band</span>
                  <span className="text-lg sm:text-xl">{entry.fullData?.overall_band || '—'}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-extrabold text-sm sm:text-lg leading-tight tracking-tight truncate max-w-[200px] sm:max-w-none text-slate-900 dark:text-slate-100">
                    {entry.taskType}: {(entry.question || 'No Topic').substring(0, 30)}...
                  </h4>
                  <p className="text-slate-600 dark:text-slate-400 text-[8px] sm:text-[10px] mt-1 sm:mt-2 font-bold uppercase tracking-wider italic">
                    {entry.date || 'Unknown Date'}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between w-full md:w-auto gap-2 border-t md:border-0 pt-3 md:pt-0 border-slate-200 dark:border-slate-800">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => onDownloadEntry(entry)}
                    className="p-3 sm:p-4 bg-slate-100 dark:bg-slate-800 rounded-xl sm:rounded-2xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                    title="Download PDF"
                  >
                    <Download className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteEntry(entry.id)}
                    className="p-3 sm:p-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl sm:rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-all active:scale-90 border border-slate-200 dark:border-slate-700"
                  >
                    <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => onReviewEntry(entry)}
                  className="flex-1 md:flex-none px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-extrabold text-xs tracking-tight bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-sm active:scale-95 text-center"
                  title={
                    resolveArchiveHistoryId(entry)
                      ? 'Open full analysis (highlights, criteria, audio)'
                      : 'Open in editor (legacy local entry)'
                  }
                >
                  {resolveArchiveHistoryId(entry) ? 'Full report' : 'Review'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
