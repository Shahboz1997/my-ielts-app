'use client';

import { Image as ImageIcon } from 'lucide-react';
import Zoom from 'react-medium-image-zoom';
import { LETTER_TONES, LETTER_PURPOSES } from '@/lib/task1LetterPrompt';

export default function Task1Editor({
  isGtLetter,
  darkMode,
  letterMeta,
  setLetterMeta,
  image,
  isDescribing,
  imageUploadError,
  onImageUpload,
}) {
  if (isGtLetter) {
    return (
      <div className="sticky top-4 z-30 mb-8 space-y-4">
        <div className="rounded-3xl border border-teal-200/80 dark:border-teal-800/50 bg-teal-50/50 dark:bg-teal-950/20 p-4 md:p-6 space-y-4">
          <p className="text-xs font-semibold text-teal-800 dark:text-teal-200 uppercase tracking-wider">
            GT Letter — situation &amp; bullets
          </p>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
            Write 150+ words. Use a clear opening (why you write), cover every bullet, and match the tone below.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label className="space-y-1">
              <span className="text-[10px] font-bold uppercase text-slate-500">Tone</span>
              <select
                value={letterMeta.tone}
                onChange={(e) => setLetterMeta((m) => ({ ...m, tone: e.target.value }))}
                className={`w-full rounded-xl border px-3 py-2 text-sm font-medium ${
                  darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200'
                }`}
              >
                {LETTER_TONES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-[10px] font-bold uppercase text-slate-500">Purpose</span>
              <select
                value={letterMeta.purpose}
                onChange={(e) => setLetterMeta((m) => ({ ...m, purpose: e.target.value }))}
                className={`w-full rounded-xl border px-3 py-2 text-sm font-medium ${
                  darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200'
                }`}
              >
                {LETTER_PURPOSES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-[10px] font-bold uppercase text-slate-500">Bullets in task</span>
              <select
                value={letterMeta.bulletCount}
                onChange={(e) => setLetterMeta((m) => ({ ...m, bulletCount: Number(e.target.value) }))}
                className={`w-full rounded-xl border px-3 py-2 text-sm font-medium ${
                  darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200'
                }`}
              >
                {[2, 3, 4].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="rounded-2xl border border-dashed border-teal-300/60 dark:border-teal-700/50 p-3 text-[11px] text-slate-600 dark:text-slate-400 font-mono leading-relaxed">
            Dear Sir or Madam,
            <br />
            [Opening — purpose]
            <br />
            [Body — bullet 1 &amp; 2]
            <br />
            [Request / closing line]
            <br />
            Yours faithfully,
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="sticky top-4 z-30 mb-8 space-y-4">
      <div className="group sticky top-4 z-40 transition-all duration-300">
        <div className="block w-full border border-dashed border-indigo-100 dark:border-slate-700 rounded-3xl p-4 text-center backdrop-blur-md bg-white/80 dark:bg-slate-900/60 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
          {image ? (
            <div className="relative inline-block w-full">
              {isDescribing && (
                <div className="absolute inset-0 z-20 overflow-hidden rounded-2xl pointer-events-none">
                  <div className="w-full h-1 bg-indigo-500 shadow-[0_0_15px_rgba(79,70,229,0.5)] animate-scan-line" />
                </div>
              )}
              <Zoom overlayBgColorEnd="rgba(0, 0, 0, 0.85)" transitionDuration={400}>
                <img
                  src={image}
                  className={`max-h-40 md:max-h-56 mx-auto rounded-2xl shadow-lg border-2 border-white dark:border-slate-800 cursor-zoom-in transition-all duration-500 ${
                    isDescribing ? 'opacity-50 grayscale blur-[2px]' : 'group-hover:scale-[1.01]'
                  }`}
                  alt="Task 1 Graphic"
                />
              </Zoom>
              {!isDescribing && (
                <label className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs font-semibold px-3 py-1 rounded-full cursor-pointer hover:bg-indigo-700 transition-colors shadow-sm whitespace-nowrap z-40">
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) onImageUpload(file);
                    }}
                  />
                  Click to Replace
                </label>
              )}
            </div>
          ) : (
            <label className="cursor-pointer space-y-2 block py-6">
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onImageUpload(file);
                }}
              />
              <ImageIcon className="w-10 h-10 mx-auto text-indigo-500" strokeWidth={1.5} />
              <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400 tracking-tight">Upload Diagram</p>
            </label>
          )}
          {imageUploadError && (
            <p className="mt-3 text-sm text-red-600 dark:text-red-400 text-center px-2">{imageUploadError}</p>
          )}
        </div>
      </div>
    </div>
  );
}
