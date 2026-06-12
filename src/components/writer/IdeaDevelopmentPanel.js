'use client';

export default function IdeaDevelopmentPanel({ activeTab, activeResult, darkMode }) {
  if (activeTab !== 'Task 2' || !activeResult?.idea_development) return null;

  const idea = activeResult.idea_development;
  const summary =
    typeof idea?.overall?.summary === 'string' ? idea.overall.summary.trim() : '';
  const paragraphs = Array.isArray(idea?.paragraphs) ? idea.paragraphs : [];
  const score = Number(idea?.overall?.score_0_5);
  const depthLabel = Number.isFinite(score)
    ? `${Math.max(0, Math.min(5, score))}/5`
    : '—';

  return (
    <section className="w-full min-w-0">
      <div className="border-y border-slate-100 bg-slate-50/60 p-4 dark:border-white/5 dark:bg-white/5 sm:rounded-2xl sm:border sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
              Idea development
            </div>
            {summary ? (
              <p className="mt-1 text-sm leading-relaxed text-slate-700 dark:text-slate-300">{summary}</p>
            ) : null}
          </div>
          <div className="shrink-0 rounded-xl border border-indigo-200/70 bg-white/80 px-3 py-2 text-center dark:border-indigo-500/30 dark:bg-slate-950/40">
            <div className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-slate-400">Depth</div>
            <div className="text-lg font-black tracking-tight text-indigo-600 tabular-nums dark:text-indigo-300">
              {depthLabel}
            </div>
          </div>
        </div>

        {paragraphs.length > 0 && (
          <div className="mt-4 space-y-3 sm:mt-5">
            {paragraphs.slice(0, 6).map((p, idx) => {
              const label = typeof p?.label === 'string' ? p.label : `Paragraph ${idx + 1}`;
              const mainIdea = typeof p?.main_idea === 'string' ? p.main_idea : '';
              const missing = Array.isArray(p?.missing) ? p.missing : [];
              const upgrades = Array.isArray(p?.upgrades) ? p.upgrades : [];
              return (
                <div
                  key={`${label}-${idx}`}
                  className="rounded-xl border border-slate-200/70 bg-white/70 p-3 dark:border-slate-800/60 dark:bg-slate-950/30 sm:p-4"
                >
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                      {label}
                    </span>
                    {missing.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {missing.slice(0, 5).map((m, mi) => (
                          <span
                            key={`${label}-m-${mi}`}
                            className="inline-flex items-center rounded-full border border-amber-200/70 bg-amber-50/60 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:border-amber-600/30 dark:bg-amber-900/10 dark:text-amber-200"
                            title="Missing piece to add depth"
                          >
                            {String(m).replace(/_/g, ' ')}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  {mainIdea ? (
                    <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                      <span className="font-semibold text-slate-900 dark:text-slate-100">Main idea:</span>{' '}
                      {mainIdea}
                    </p>
                  ) : null}
                  {upgrades.length > 0 && (
                    <ul className="mt-2 list-inside list-disc space-y-1.5 text-sm text-slate-700 dark:text-slate-300">
                      {upgrades.slice(0, 2).map((u, ui) => (
                        <li key={`${label}-u-${ui}`}>{u}</li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
