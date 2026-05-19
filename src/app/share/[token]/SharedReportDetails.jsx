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

function splitEssayParagraphs(text, { keepMarks = false } = {}) {
  let prepared = String(text || '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .trim();
  if (!prepared) return [];
  if (!keepMarks) prepared = stripMark(prepared);

  const normalizePara = (p) => {
    const collapsed = p.replace(/\n+/g, ' ').replace(/[ \t]+/g, ' ').trim();
    return collapsed;
  };

  const byBlank = prepared
    .split(/\n\s*\n+/)
    .map(normalizePara)
    .filter(Boolean);
  if (byBlank.length > 1) return byBlank;
  return prepared
    .split(/\n+/)
    .map(normalizePara)
    .filter(Boolean);
}

const MARK_PAIR_RE = /<mark\b[^>]*>([\s\S]*?)<\/mark>/gi;

function parseMarkSegments(text) {
  const s = String(text || '');
  if (!s) return [];
  const segments = [];
  let last = 0;
  let match;
  const re = new RegExp(MARK_PAIR_RE.source, 'gi');
  while ((match = re.exec(s)) !== null) {
    if (match.index > last) {
      segments.push({ type: 'text', value: s.slice(last, match.index) });
    }
    segments.push({ type: 'mark', value: match[1] });
    last = match.index + match[0].length;
  }
  if (last < s.length) segments.push({ type: 'text', value: s.slice(last) });
  return segments.length ? segments : [{ type: 'text', value: s }];
}

function RenderParagraphWithMarks({ text, paraKey }) {
  const segments = parseMarkSegments(text);
  return (
    <>
      {segments.map((seg, i) =>
        seg.type === 'mark' ? (
          <mark
            key={`${paraKey}-m-${i}`}
            className="rounded-sm border-b-2 border-amber-400/60 bg-amber-400/15 px-0.5 font-semibold text-amber-100 not-italic"
          >
            {seg.value}
          </mark>
        ) : (
          <span key={`${paraKey}-t-${i}`}>{seg.value}</span>
        )
      )}
    </>
  );
}

function SectionHeader({ kicker, title, subtitle, badge }) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {kicker ? (
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-white/50">{kicker}</p>
        ) : null}
        <h3 className="mt-1 text-lg font-black tracking-tight text-white sm:text-xl">{title}</h3>
        {subtitle ? <p className="mt-1 max-w-2xl text-sm font-semibold text-white/65">{subtitle}</p> : null}
      </div>
      {badge ? <div className="shrink-0">{badge}</div> : null}
    </div>
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
              className="group rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-sm transition-colors hover:border-indigo-400/30 sm:p-6"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-300/90">{card.short}</p>
                  <p className="mt-1 text-sm font-bold text-white">{card.label}</p>
                </div>
                <span className="inline-flex min-w-[3rem] items-center justify-center rounded-2xl bg-indigo-500 px-3 py-2 text-xl font-black text-white shadow-lg shadow-indigo-500/25">
                  {scoreShown}
                </span>
              </div>
              <ul className="mt-4 space-y-2 border-t border-white/10 pt-4">
                {bullets.length > 0 ? (
                  bullets.map((b, i) => (
                    <li key={i} className="flex gap-2 text-[13px] font-semibold leading-snug text-white/75">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" aria-hidden />
                      <span>{b}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-[13px] font-medium text-white/45">No specific notes for this criterion.</li>
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
          <span className="inline-flex flex-col items-end rounded-2xl border border-amber-400/25 bg-amber-500/10 px-4 py-2">
            <span className="text-[9px] font-black uppercase tracking-widest text-amber-200/80">Body plan</span>
            <span className="text-lg font-black text-amber-100">{bodyCount} body</span>
          </span>
        }
      />

      {Array.isArray(strategy.paragraph_plan) && strategy.paragraph_plan.length > 0 && (
        <div className="mb-4 rounded-[1.75rem] border border-white/10 bg-black/25 p-5">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/50">Recommended paragraph plan</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {strategy.paragraph_plan.slice(0, 8).map((p, i) => (
              <span
                key={`${p}-${i}`}
                className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] font-semibold text-white/85"
              >
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
              <article key={`${label}-${idx}`} className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-5">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/55">{label}</p>
                  <span className="rounded-full border border-amber-400/30 bg-amber-500/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-amber-200">
                    Grouping
                  </span>
                </div>
                {focus ? (
                  <p className="mt-3 text-sm font-semibold leading-relaxed text-white/80">
                    <span className="text-white">Focus:</span> {focus}
                  </p>
                ) : null}
                {comps.length > 0 && (
                  <ul className="mt-3 space-y-1.5">
                    {comps.slice(0, 4).map((c, ci) => (
                      <li key={ci} className="flex gap-2 text-sm font-medium text-white/70">
                        <span className="text-indigo-400">→</span>
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
        <div className="mt-4 rounded-[1.75rem] border border-rose-400/20 bg-rose-500/5 p-5">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-rose-200/80">Quick fixes</p>
          <ul className="mt-3 space-y-2">
            {strategy.what_to_fix.slice(0, 8).map((x, i) => (
              <li key={i} className="flex gap-2 text-sm font-semibold text-white/80">
                <span className="font-black text-rose-300">{i + 1}.</span>
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
      <div className="rounded-[1.75rem] border border-indigo-400/25 bg-gradient-to-br from-indigo-500/15 via-transparent to-violet-500/10 p-6">
        {paragraphs.map((p, i) => (
          <p key={i} className={`text-sm font-semibold leading-relaxed text-white/85 ${i > 0 ? 'mt-4' : ''}`}>
            {p}
          </p>
        ))}
      </div>
    </section>
  );
}

function LinguisticInsights({ insights }) {
  const { linking, repetitions, lexical, plagiarism, cefr } = insights;
  const hasAnything =
    linking ||
    repetitions?.length > 0 ||
    lexical?.length > 0 ||
    plagiarism ||
    (cefr && Object.keys(cefr).length > 0);
  if (!hasAnything) return null;

  return (
    <section className="mt-8">
      <SectionHeader
        kicker="Section 03"
        title="Linguistic Insights"
        subtitle="Linking, repetition alerts, lexical upgrades, and originality."
      />

      <div className="space-y-4">
        {linking && (
          <article className="rounded-[1.75rem] border border-amber-400/20 bg-amber-500/[0.07] p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-amber-200">Linking words</p>
              {linking.score != null && (
                <span className="text-[11px] font-black text-amber-100">Flow {linking.score}/9</span>
              )}
            </div>
            {linking.found?.length > 0 && (
              <div className="mt-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-white/45">Found</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {linking.found.map((w, i) => (
                    <span
                      key={`${w}-${i}`}
                      className="rounded-xl border border-white/15 bg-black/30 px-3 py-1.5 text-[11px] font-semibold text-white/90"
                    >
                      {w}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {linking.suggestions?.length > 0 && (
              <div className="mt-4 rounded-2xl border border-dashed border-amber-400/30 bg-black/20 p-4">
                <p className="text-[10px] font-black uppercase tracking-wider text-amber-200/90">Suggested additions</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {linking.suggestions.map((s, i) => (
                    <span
                      key={`${s}-${i}`}
                      className="rounded-xl border border-amber-400/25 bg-amber-500/10 px-2.5 py-1 text-[11px] font-bold text-amber-100"
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
          <article className="rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-5">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-rose-200">Frequency alert</p>
            <ul className="mt-4 space-y-3">
              {repetitions.slice(0, 12).map((item, i) => {
                const word = typeof item === 'object' ? item.word : item;
                const count = typeof item === 'object' ? item.count : 0;
                const alts = typeof item === 'object' && Array.isArray(item.alternatives) ? item.alternatives : [];
                return (
                  <li key={`${word}-${i}`} className="rounded-2xl border border-white/10 bg-black/25 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-black text-white">&ldquo;{word}&rdquo;</span>
                      {count > 0 && (
                        <span className="rounded-full border border-rose-400/30 bg-rose-500/15 px-2 py-0.5 text-[10px] font-bold text-rose-200">
                          {count}×
                        </span>
                      )}
                    </div>
                    {alts.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5 border-t border-white/10 pt-3">
                        {alts.slice(0, 8).map((a) => (
                          <span
                            key={a}
                            className="rounded-lg border border-emerald-400/25 bg-emerald-500/10 px-2 py-1 text-[10px] font-bold text-emerald-200"
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

        {lexical?.length > 0 && (
          <article className="rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-5">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-indigo-200">Lexical refinement</p>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[320px] border-collapse text-left text-[12px]">
                <thead>
                  <tr className="border-b border-white/15 text-[10px] font-black uppercase tracking-wider text-white/50">
                    <th className="pb-2 pr-3">Weaker choice</th>
                    <th className="pb-2">Band 8+ alternatives</th>
                  </tr>
                </thead>
                <tbody>
                  {lexical.slice(0, 20).map((row, i) => (
                    <tr key={i} className="border-b border-white/5">
                      <td className="py-2.5 pr-3 font-semibold text-white/90">{row.basic}</td>
                      <td className="py-2.5 font-medium text-emerald-200/90">{row.upgrade}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        )}

        {plagiarism && (plagiarism.score != null || plagiarism.status) && (
          <article className="rounded-[1.75rem] border border-white/10 bg-black/25 p-5">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/50">Originality check</p>
            {plagiarism.score != null && (
              <p className="mt-2 text-2xl font-black text-white">{plagiarism.score}%</p>
            )}
            {plagiarism.status ? (
              <p className="mt-2 text-sm font-semibold text-white/75">{plagiarism.status}</p>
            ) : null}
          </article>
        )}

        {cefr && Object.keys(cefr).length > 0 && (
          <article className="rounded-[1.75rem] border border-white/10 bg-black/25 p-5">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/50">CEFR distribution</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map((lvl) => (
                <span
                  key={lvl}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[11px] font-bold text-white/80"
                >
                  {lvl} <span className="text-indigo-300">{cefr[lvl] ?? 0}%</span>
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
        kicker="Section 04"
        title="Detailed Corrections"
        subtitle={`${corrections.length} actionable fix${corrections.length === 1 ? '' : 'es'} with explanations.`}
      />
      <ol className="space-y-4">
        {corrections.map((err, i) => {
          const typeLabel = err.category || err.rule || 'Grammar';
          const recommended = stripMark(err.fixed || err.suggestion || '').trim();
          return (
            <li
              key={`${err.original}-${i}`}
              className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-5 sm:p-6"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-indigo-500/20 text-[11px] font-black text-indigo-200">
                  {i + 1}
                </span>
                <span className="rounded-full border border-white/15 bg-white/5 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-white/70">
                  {typeLabel}
                </span>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-white/45">Original</p>
                  <p className="mt-2 text-sm font-medium leading-relaxed text-white/50 line-through decoration-rose-400/60">
                    {stripMark(err.original) || '—'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-emerald-300/80">Correction</p>
                  <p className="mt-2 text-sm font-semibold leading-relaxed text-emerald-100">
                    {recommended || '—'}
                  </p>
                </div>
              </div>

              {err.explanation ? (
                <p className="mt-4 border-t border-white/10 pt-4 text-[13px] font-medium leading-relaxed text-white/70">
                  <span className="font-black text-white/90">Why: </span>
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

function ImprovedEssay({ text }) {
  const paragraphs = splitEssayParagraphs(text, { keepMarks: true });
  if (!paragraphs.length) return null;

  const hasMarks = /<mark\b/i.test(String(text || ''));

  return (
    <section className="mt-8">
      <SectionHeader
        kicker="Section 05"
        title="Improved essay"
        subtitle="Academic suggested rewrite — same layout as Comparison Lab on STRATUM."
      />

      <article className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.04] backdrop-blur-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-black/25 px-5 py-4 sm:px-6">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/50">
              Academic suggested rewrite
            </p>
            <p className="mt-1 text-xs font-semibold text-white/65">Band 9 target · paragraph structure</p>
          </div>
          <span className="inline-flex items-center rounded-full border border-emerald-400/35 bg-emerald-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-200">
            Band 8.5+
          </span>
        </div>

        <div className="p-4 sm:p-5 md:p-6">
          <div className="rounded-2xl border border-white/10 bg-black/40 px-4 py-5 sm:px-6 sm:py-6">
            {paragraphs.map((para, i) => {
              const isConclusion = /^\s*In conclusion\b/i.test(stripMark(para));
              const isFirst = i === 0;
              return (
                <p
                  key={i}
                  className={`mb-4 text-justify font-serif text-[15px] font-normal leading-[1.7] text-white/88 last:mb-0 sm:mb-5 sm:text-base sm:leading-[1.75] md:text-[17px] ${
                    isConclusion ? 'mt-2 italic text-white/75 sm:mt-3' : ''
                  } ${
                    isFirst
                      ? 'md:first-letter:float-left md:first-letter:mr-2.5 md:first-letter:mt-1 md:first-letter:text-5xl md:first-letter:font-black md:first-letter:leading-[0.85] md:first-letter:text-indigo-300'
                      : ''
                  }`}
                >
                  <RenderParagraphWithMarks text={para} paraKey={`p-${i}`} />
                </p>
              );
            })}
          </div>

          {hasMarks ? (
            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-white/10 pt-4">
              <span className="h-2 w-2 shrink-0 rounded-full bg-amber-400" aria-hidden />
              <span className="text-[10px] font-black uppercase tracking-wider text-white/45">
                Highlighted phrases — Band 8+ upgrades
              </span>
            </div>
          ) : null}
        </div>
      </article>
    </section>
  );
}

export default function SharedReportDetails({ task }) {
  const isTask1 = task.type === 'TASK_1';

  return (
    <div className="mt-6 space-y-2">
      <CriteriaBreakdown criteria={task.criteria} isTask1={isTask1} />
      {isTask1 ? <Task1Strategy strategy={task.task1Strategy} /> : null}
      <ImprovementStrategy text={task.improvementStrategy} />
      <LinguisticInsights insights={task.insights} />
      <DetailedCorrections corrections={task.corrections} />
      <ImprovedEssay text={task.suggestedRewrite} />
    </div>
  );
}
