import LetterStrategyPanel from '@/components/LetterStrategyPanel';
import CambridgeDictionaryLink from '@/components/CambridgeDictionaryLink';
import ShareComparisonLabLazy from './ShareComparisonLabLazy';
import { shareTheme as T } from './shareTheme';

function toBullets(text, max = 8) {
  if (!text || typeof text !== 'string') return [];
  return text
    .split(/\n+|\.\s+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, max);
}

function stripMark(text) {
  return String(text ?? '').replace(/<\/?mark\b[^>]*>/gi, '');
}

function SectionHeader({ kicker, title, subtitle, badge }) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {kicker ? <p className={T.kicker}>{kicker}</p> : null}
        <h3 className={T.title}>{title}</h3>
        {subtitle ? <p className={T.subtitle}>{subtitle}</p> : null}
      </div>
      {badge ? <div className="shrink-0">{badge}</div> : null}
    </div>
  );
}

function TutorNotes({ comment }) {
  const body = String(comment || '').trim();
  if (!body) return null;

  return (
    <section className="mt-8">
      <SectionHeader
        kicker="Tutor review"
        title="Tutor's notes"
        subtitle="Personal feedback from your instructor."
      />
      <article className={`${T.panel} border-amber-200 bg-amber-50/50 p-5 sm:p-6`}>
        <p className="whitespace-pre-wrap text-sm font-semibold leading-relaxed text-slate-800">{body}</p>
      </article>
    </section>
  );
}

function CriteriaBreakdown({ criteria, isTask1 }) {
  const cards = [
    {
      key: 'task',
      label: isTask1 ? 'Task Achievement' : 'Task Response',
      short: isTask1 ? 'TA' : 'TR',
      score: criteria.task,
      comment: criteria.taskComment,
    },
    { key: 'cc', label: 'Coherence & Cohesion', short: 'CC', score: criteria.cc, comment: criteria.ccComment },
    { key: 'lr', label: 'Lexical Resource', short: 'LR', score: criteria.lr, comment: criteria.lrComment },
    {
      key: 'gra',
      label: 'Grammatical Range & Accuracy',
      short: 'GRA',
      score: criteria.gra,
      comment: criteria.graComment,
    },
  ];

  return (
    <section className="mt-8">
      <SectionHeader
        kicker="Section 01"
        title="Criteria Breakdown"
        subtitle="Official IELTS Writing rubric scores with examiner-style feedback."
      />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {cards.map((card) => {
          const bullets = toBullets(card.comment, 6);
          const scoreShown =
            card.score != null && Number.isFinite(Number(card.score)) ? Number(card.score).toFixed(1) : '—';
          return (
            <article
              key={card.key}
              className={`group ${T.panel} p-5 transition-colors hover:border-indigo-200 sm:p-6`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600">{card.short}</p>
                  <p className="mt-1 text-sm font-bold text-slate-900">{card.label}</p>
                </div>
                <span className="inline-flex min-w-[3rem] items-center justify-center rounded-2xl bg-indigo-600 px-3 py-2 text-xl font-black text-white shadow-md shadow-indigo-200">
                  {scoreShown}
                </span>
              </div>
              <ul className="mt-4 space-y-2 border-t border-slate-100 pt-4">
                {bullets.length > 0 ? (
                  bullets.map((b, i) => (
                    <li key={i} className="flex gap-2 text-[13px] font-semibold leading-snug text-slate-700">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" aria-hidden />
                      <span>{b}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-[13px] font-medium text-slate-400">No specific notes for this criterion.</li>
                )}
              </ul>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function Task1Strategy({ strategy }) {
  if (!strategy || typeof strategy !== 'object') return null;
  const hasContent =
    strategy.paragraph_plan?.length ||
    strategy.grouping_plan?.length ||
    strategy.what_to_fix?.length ||
    strategy.recommended_body_count != null;
  if (!hasContent) return null;

  const bodyCount = Number.isFinite(Number(strategy.recommended_body_count))
    ? Math.max(1, Math.min(3, Number(strategy.recommended_body_count)))
    : 2;

  return (
    <section className="mt-8">
      <SectionHeader
        kicker="Section 02"
        title="Task 1 Strategy"
        subtitle="Structure, grouping, and quick fixes for Academic Task 1."
        badge={
          <span className="inline-flex flex-col items-end rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2">
            <span className="text-[9px] font-black uppercase tracking-widest text-amber-700/80">Body plan</span>
            <span className="text-lg font-black text-amber-900">{bodyCount} body</span>
          </span>
        }
      />

      {Array.isArray(strategy.paragraph_plan) && strategy.paragraph_plan.length > 0 && (
        <div className={`mb-4 ${T.panel} p-5`}>
          <p className={T.label}>Recommended paragraph plan</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {strategy.paragraph_plan.slice(0, 8).map((p, i) => (
              <span key={`${p}-${i}`} className={T.chip}>
                {p}
              </span>
            ))}
          </div>
        </div>
      )}

      {Array.isArray(strategy.grouping_plan) && strategy.grouping_plan.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {strategy.grouping_plan.slice(0, 2).map((g, idx) => {
            const label = typeof g?.label === 'string' ? g.label : `Body ${idx + 1}`;
            const focus = typeof g?.focus === 'string' ? g.focus : '';
            const comps = Array.isArray(g?.comparisons_to_make) ? g.comparisons_to_make : [];
            return (
              <article key={`${label}-${idx}`} className={`${T.panel} p-5`}>
                <div className="flex items-center justify-between gap-2">
                  <p className={T.label}>{label}</p>
                  <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-amber-800">
                    Grouping
                  </span>
                </div>
                {focus ? (
                  <p className={`mt-3 ${T.bodyStrong}`}>
                    <span className="font-bold text-slate-900">Focus:</span> {focus}
                  </p>
                ) : null}
                {comps.length > 0 && (
                  <ul className="mt-3 space-y-1.5">
                    {comps.slice(0, 4).map((c, ci) => (
                      <li key={ci} className={`flex gap-2 ${T.body}`}>
                        <span className="text-indigo-500">→</span>
                        {c}
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            );
          })}
        </div>
      )}

      {Array.isArray(strategy.what_to_fix) && strategy.what_to_fix.length > 0 && (
        <div className={`mt-4 ${T.panel} border-rose-200 bg-rose-50/50 p-5`}>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-rose-700">Quick fixes</p>
          <ul className="mt-3 space-y-2">
            {strategy.what_to_fix.slice(0, 8).map((x, i) => (
              <li key={i} className={`flex gap-2 ${T.bodyStrong}`}>
                <span className="font-black text-rose-600">{i + 1}.</span>
                {x}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function ImprovementStrategy({ text }) {
  const body = stripMark(text).trim();
  if (!body) return null;
  const paragraphs = body.split(/\n\s*\n+|\n+/).map((p) => p.trim()).filter(Boolean);

  return (
    <section className="mt-8">
      <SectionHeader
        kicker="Strategy"
        title="Improvement Strategy"
        subtitle="Priority actions to raise your band on the next attempt."
      />
      <div className={`${T.panel} border-indigo-200 bg-gradient-to-br from-indigo-50 via-white to-violet-50/60 p-6`}>
        {paragraphs.map((p, i) => (
          <p key={i} className={`${T.bodyStrong} ${i > 0 ? 'mt-4' : ''}`}>
            {p}
          </p>
        ))}
      </div>
    </section>
  );
}

function IdeaDevelopment({ ideaDevelopment }) {
  if (!ideaDevelopment || typeof ideaDevelopment !== 'object') return null;

  const summary =
    typeof ideaDevelopment?.overall?.summary === 'string' ? ideaDevelopment.overall.summary.trim() : '';
  const score = Number(ideaDevelopment?.overall?.score_0_5);
  const depthLabel = Number.isFinite(score)
    ? `${Math.max(0, Math.min(5, score))}/5`
    : '—';
  const paragraphs = Array.isArray(ideaDevelopment?.paragraphs) ? ideaDevelopment.paragraphs : [];

  if (!summary && paragraphs.length === 0) return null;

  return (
    <section className="mt-8">
      <SectionHeader
        kicker="Section 02"
        title="Idea development"
        subtitle="Depth of arguments by paragraph — what to add for stronger Task Response."
        badge={
          <span className="inline-flex flex-col items-end rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-2">
            <span className="text-[9px] font-black uppercase tracking-widest text-indigo-600">Depth</span>
            <span className="text-lg font-black text-indigo-900">{depthLabel}</span>
          </span>
        }
      />
      <div className={`${T.panel} p-5 sm:p-6`}>
        {summary ? <p className={T.bodyStrong}>{summary}</p> : null}
        {paragraphs.length > 0 && (
          <div className={`space-y-4 ${summary ? 'mt-5 border-t border-slate-100 pt-5' : ''}`}>
            {paragraphs.slice(0, 6).map((p, idx) => {
              const label = typeof p?.label === 'string' ? p.label : `Paragraph ${idx + 1}`;
              const mainIdea = typeof p?.main_idea === 'string' ? p.main_idea : '';
              const missing = Array.isArray(p?.missing) ? p.missing : [];
              const upgrades = Array.isArray(p?.upgrades) ? p.upgrades : [];
              return (
                <article key={`${label}-${idx}`} className={T.cardMuted}>
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <span className={T.label}>{label}</span>
                    {missing.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {missing.slice(0, 5).map((m, mi) => (
                          <span
                            key={`${label}-m-${mi}`}
                            className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800"
                          >
                            {String(m).replace(/_/g, ' ')}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  {mainIdea ? (
                    <p className={T.body}>
                      <span className="font-semibold text-slate-900">Main idea:</span> {mainIdea}
                    </p>
                  ) : null}
                  {upgrades.length > 0 && (
                    <ul className="mt-2 list-inside list-disc space-y-1.5 text-sm text-slate-600">
                      {upgrades.slice(0, 2).map((u, ui) => (
                        <li key={`${label}-u-${ui}`}>{u}</li>
                      ))}
                    </ul>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

function LexicalUpgrade({ rows }) {
  if (!rows?.length) return null;

  return (
    <section className="mt-8">
      <SectionHeader
        kicker="Section 03"
        title="Lexical upgrade"
        subtitle="Weak Band 5–6 words from the essay → C1/C2 synonyms with example sentences."
      />
      <div className={`overflow-hidden ${T.panel}`}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-indigo-50/40 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <span
              className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-indigo-100 text-base"
              aria-hidden
            >
              ✨
            </span>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
                CEFR vocabulary
              </p>
              <p className="text-xs font-semibold text-slate-600">
                {rows.length} upgrade{rows.length === 1 ? '' : 's'} from your essay
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-wider">
            <span className="rounded-full bg-violet-100 px-2.5 py-1 text-violet-700">C1 · Band 7–8</span>
            <span className="rounded-full bg-orange-100 px-2.5 py-1 text-orange-800">C2 · Band 8–9</span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 bg-slate-50/50 p-4 sm:grid-cols-2 sm:gap-4 sm:p-5 md:p-6">
          {rows.slice(0, 20).map((row, i) => {
            const weakWord = row.band_56_word || '—';
            const c1 = Array.isArray(row.c1_synonyms) ? row.c1_synonyms : [];
            const c2 = Array.isArray(row.c2_synonyms) ? row.c2_synonyms : [];
            return (
              <article
                key={`${weakWord}-${i}`}
                className="flex flex-col rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition-shadow hover:border-indigo-200/80 hover:shadow-md sm:p-5"
              >
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <span className="inline-flex shrink-0 items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">
                    B5–6
                  </span>
                  <span className="truncate text-sm font-bold italic text-slate-900">{weakWord}</span>
                </div>

                {c1.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[9px] font-black uppercase tracking-wider text-violet-600">C1</span>
                      <span className="text-[8px] font-medium text-slate-400">Band 7–8</span>
                      {c1.slice(0, 4).map((syn, si) => (
                        <span
                          key={`c1-${weakWord}-${si}`}
                          className="rounded-full bg-violet-50 px-2.5 py-0.5 text-[10px] font-semibold text-violet-700 ring-1 ring-violet-100"
                        >
                          {syn}
                        </span>
                      ))}
                    </div>
                    {row.c1_example ? (
                      <p className="rounded-xl bg-slate-50 px-3 py-2 text-[11px] leading-relaxed text-slate-500 italic">
                        {row.c1_example}
                      </p>
                    ) : null}
                  </div>
                )}

                {c2.length > 0 && (
                  <div className={`space-y-2 ${c1.length > 0 ? 'mt-3 border-t border-slate-100 pt-3' : 'mt-3'}`}>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[9px] font-black uppercase tracking-wider text-orange-600">C2</span>
                      <span className="text-[8px] font-medium text-slate-400">Band 8–9</span>
                      {c2.slice(0, 4).map((syn, si) => (
                        <span
                          key={`c2-${weakWord}-${si}`}
                          className="rounded-full bg-orange-50 px-2.5 py-0.5 text-[10px] font-semibold text-orange-800 ring-1 ring-orange-100"
                        >
                          {syn}
                        </span>
                      ))}
                    </div>
                    {row.c2_example ? (
                      <p className="rounded-xl bg-slate-50 px-3 py-2 text-[11px] leading-relaxed text-slate-500 italic">
                        {row.c2_example}
                      </p>
                    ) : null}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function LinguisticInsights({ insights }) {
  const { linking, repetitions, plagiarism, cefr } = insights;
  const hasAnything =
    linking ||
    repetitions?.length > 0 ||
    plagiarism ||
    (cefr && Object.keys(cefr).length > 0);
  if (!hasAnything) return null;

  return (
    <section className="mt-8">
      <SectionHeader
        kicker="Section 04"
        title="Linguistic Insights"
        subtitle="Linking words, repetition alerts, and originality."
      />

      <div className="space-y-4">
        {linking && (
          <article className={`${T.panel} border-amber-200 bg-amber-50/40 p-5`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-amber-800">Linking words</p>
              {linking.score != null && (
                <span className="text-[11px] font-black text-amber-900">Flow {linking.score}/9</span>
              )}
            </div>
            {linking.found?.length > 0 && (
              <div className="mt-3">
                <p className={T.label}>Found</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {linking.found.map((w, i) => (
                    <span key={`${w}-${i}`} className={T.chip}>
                      {w}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {linking.suggestions?.length > 0 && (
              <div className="mt-4 rounded-2xl border border-dashed border-amber-300 bg-white p-4">
                <p className="text-[10px] font-black uppercase tracking-wider text-amber-800">Suggested additions</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {linking.suggestions.map((s, i) => (
                    <span
                      key={`${s}-${i}`}
                      className="rounded-xl border border-amber-200 bg-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-900"
                    >
                      + {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </article>
        )}

        {repetitions?.length > 0 && (
          <article className={`${T.panel} p-5`}>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-rose-700">Frequency alert</p>
            <ul className="mt-4 space-y-3">
              {repetitions.slice(0, 12).map((item, i) => {
                const word = typeof item === 'object' ? item.word : item;
                const count = typeof item === 'object' ? item.count : 0;
                const alts = typeof item === 'object' && Array.isArray(item.alternatives) ? item.alternatives : [];
                return (
                  <li key={`${word}-${i}`} className={T.cardMuted}>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-black text-slate-900">&ldquo;{word}&rdquo;</span>
                      {count > 0 && (
                        <span className="rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                          {count}×
                        </span>
                      )}
                    </div>
                    {alts.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5 border-t border-slate-200 pt-3">
                        {alts.slice(0, 8).map((a) => (
                          <span
                            key={a}
                            className="rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-800"
                          >
                            {a}
                          </span>
                        ))}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </article>
        )}

        {plagiarism && (plagiarism.score != null || plagiarism.status) && (
          <article className={`${T.panel} p-5`}>
            <p className={T.label}>Originality check</p>
            {plagiarism.score != null && (
              <p className="mt-2 text-2xl font-black text-slate-900">{plagiarism.score}%</p>
            )}
            {plagiarism.status ? <p className={`mt-2 ${T.bodyStrong}`}>{plagiarism.status}</p> : null}
          </article>
        )}

        {cefr && Object.keys(cefr).length > 0 && (
          <article className={`${T.panel} p-5`}>
            <p className={T.label}>CEFR distribution</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map((lvl) => (
                <span key={lvl} className={T.chip}>
                  {lvl} <span className="text-indigo-600">{cefr[lvl] ?? 0}%</span>
                </span>
              ))}
            </div>
          </article>
        )}
      </div>
    </section>
  );
}

function DetailedCorrections({ corrections }) {
  if (!corrections?.length) return null;

  return (
    <section className="mt-8">
      <SectionHeader
        kicker="Section 05"
        title="Detailed Corrections"
        subtitle={`${corrections.length} actionable fix${corrections.length === 1 ? '' : 'es'} with explanations.`}
      />
      <ol className="space-y-4">
        {corrections.map((err, i) => {
          const typeLabel = err.category || err.rule || 'Grammar';
          const recommended = stripMark(err.fixed || err.suggestion || '').trim();
          return (
            <li key={`${err.original}-${i}`} className={`${T.panel} p-5 sm:p-6`}>
              <div className="flex flex-wrap items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-indigo-100 text-[11px] font-black text-indigo-700">
                  {i + 1}
                </span>
                <span className={T.chip}>{typeLabel}</span>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <p className={T.label}>Original</p>
                  <p className="mt-2 text-sm font-medium leading-relaxed text-slate-400 line-through decoration-rose-400/70">
                    {stripMark(err.original) || '—'}
                  </p>
                  <CambridgeDictionaryLink
                    fromError={stripMark(err.original)}
                    compact
                    className="mt-2 text-indigo-600 hover:text-indigo-500"
                  />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-emerald-700">Correction</p>
                  <p className="mt-2 text-sm font-semibold leading-relaxed text-emerald-900">
                    {recommended || '—'}
                  </p>
                </div>
              </div>

              {err.explanation ? (
                <p className={`mt-4 border-t border-slate-100 pt-4 text-[13px] ${T.body}`}>
                  <span className="font-black text-slate-900">Why: </span>
                  {stripMark(err.explanation)}
                </p>
              ) : null}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

export default function SharedReportDetails({ task }) {
  const isTask1 = task.type === 'TASK_1';
  const isGtLetter = isTask1 && task.task1Kind === 'gt_letter';

  return (
    <div className="mt-6 space-y-2">
      <TutorNotes comment={task.tutorComment} />
      <CriteriaBreakdown criteria={task.criteria} isTask1={isTask1} />
      {isGtLetter && task.letterStrategy ? (
        <LetterStrategyPanel strategy={task.letterStrategy} />
      ) : null}
      {isTask1 && !isGtLetter && task.task1Strategy ? (
        <Task1Strategy strategy={task.task1Strategy} />
      ) : null}
      <ImprovementStrategy text={task.improvementStrategy} />
      {!isTask1 && <IdeaDevelopment ideaDevelopment={task.ideaDevelopment} />}
      <LexicalUpgrade rows={task.insights?.lexical} />
      <LinguisticInsights insights={task.insights} />
      <DetailedCorrections corrections={task.corrections} />
      <ShareComparisonLabLazy task={task} />
    </div>
  );
}
