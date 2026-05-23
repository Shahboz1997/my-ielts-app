export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { notFound } from "next/navigation";
import { getPrisma } from "@/lib/prisma";
import { verifyShareToken } from "@/lib/shareToken";
import { resolvePublicSiteOrigin } from "@/lib/publicSiteUrl";
import SharedReportDetails from "./SharedReportDetails";

function safeJsonParse(str) {
  try {
    return typeof str === "string" ? JSON.parse(str) : str || {};
  } catch {
    return {};
  }
}

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function scoreChip(label, value) {
  const v = Number(value);
  const shown = Number.isFinite(v) ? v.toFixed(1) : "—";
  return (
    <span className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-white">
      <span className="text-white/70">{label}</span>
      <span className="text-white">{shown}</span>
    </span>
  );
}

async function loadShare(token) {
  const verified = verifyShareToken(token);
  if (!verified.ok) return null;

  const { t1Id, t2Id, ref } = verified.data;
  const ids = [t1Id, t2Id].filter(Boolean);
  if (ids.length === 0) return null;

  const prisma = getPrisma();
  const checks = await prisma.check.findMany({
    where: { id: { in: ids } },
    select: {
      id: true,
      type: true,
      content: true,
      score: true,
      feedback: true,
      createdAt: true,
    },
  });

  // Keep stable ordering: Task 1 then Task 2.
  const byId = new Map(checks.map((c) => [c.id, c]));
  const ordered = [t1Id ? byId.get(t1Id) : null, t2Id ? byId.get(t2Id) : null].filter(Boolean);
  if (ordered.length === 0) return null;

  return {
    ref: ref || null,
    tasks: ordered.map((c) => {
      const fb = safeJsonParse(c.feedback);
      const criteria = fb.criteria || {};
      const isTask1 = (c.type || "TASK_2") === "TASK_1";
      const taskKey = isTask1 ? "Task_Achievement" : "Task_Response";
      const band =
        (fb.overall_band != null && Number.isFinite(Number(fb.overall_band)) ? Number(fb.overall_band) : null) ??
        (c.score != null && Number.isFinite(Number(c.score)) ? Number(c.score) : null);

      const lw = fb.analysis?.linking_words ?? fb.linking_words ?? null;
      const repetitions = Array.isArray(fb.analysis?.word_repetition)
        ? fb.analysis.word_repetition
        : Array.isArray(fb.word_repetition)
          ? fb.word_repetition
          : [];

      const lexicalRaw = Array.isArray(fb.lexical_upgrade) ? fb.lexical_upgrade : [];
      const lexical = lexicalRaw
        .map((item) => {
          const basic = String(item.band_56_word || item.original || "").trim();
          const c1 = Array.isArray(item.c1_synonyms)
            ? item.c1_synonyms.join(", ")
            : String(item.c1_synonyms || "");
          const c2 = Array.isArray(item.c2_synonyms)
            ? item.c2_synonyms.join(", ")
            : String(item.c2_synonyms || "");
          const legacy = Array.isArray(item.band_89_synonyms)
            ? item.band_89_synonyms.join(", ")
            : String(item.band_89_synonyms || item.synonyms || "");
          const upgrade = [c1 && `C1: ${c1}`, c2 && `C2: ${c2}`].filter(Boolean).join(" · ") || legacy;
          if (!basic && !upgrade) return null;
          return { basic: basic || "—", upgrade: upgrade || "—" };
        })
        .filter(Boolean);

      let cefr = null;
      const rawCefr = fb.cefr_stats;
      if (rawCefr && typeof rawCefr === "object") {
        cefr = {};
        if (Array.isArray(rawCefr)) {
          rawCefr.forEach((x) => {
            const id = String(x?.level ?? x?.id ?? "").toUpperCase();
            if (id) cefr[id] = Math.min(100, Math.max(0, Number(x?.percent ?? x?.value ?? 0)));
          });
        } else {
          Object.entries(rawCefr).forEach(([k, v]) => {
            cefr[String(k).toUpperCase()] = Math.min(100, Math.max(0, Number(v)));
          });
        }
        if (!Object.keys(cefr).length) cefr = null;
      }

      const corrections = Array.isArray(fb.corrections)
        ? fb.corrections.map((err) => ({
            original: err.original ?? "",
            fixed: err.fixed ?? err.suggestion ?? "",
            suggestion: err.suggestion ?? "",
            category: err.category ?? err.rule ?? "",
            rule: err.rule ?? "",
            explanation: err.explanation ?? "",
          }))
        : [];

      return {
        id: c.id,
        type: isTask1 ? "TASK_1" : "TASK_2",
        createdAt: c.createdAt,
        band,
        criteria: {
          task: criteria[taskKey]?.score ?? null,
          cc: criteria.Coherence_and_Cohesion?.score ?? null,
          lr: criteria.Lexical_Resource?.score ?? null,
          gra: criteria.Grammatical_Range_and_Accuracy?.score ?? null,
          taskComment: criteria[taskKey]?.comment ?? "",
          ccComment: criteria.Coherence_and_Cohesion?.comment ?? "",
          lrComment: criteria.Lexical_Resource?.comment ?? "",
          graComment: criteria.Grammatical_Range_and_Accuracy?.comment ?? "",
        },
        improvementStrategy:
          typeof fb.improvement_strategy === "string" ? fb.improvement_strategy : "",
        task1Strategy: isTask1 && fb.task1_strategy ? fb.task1_strategy : null,
        letterStrategy: isTask1 && fb.letter_strategy ? fb.letter_strategy : null,
        task1Kind: fb.task1Kind === "gt_letter" ? "gt_letter" : "academic",
        suggestedRewrite:
          typeof fb.suggested_rewrite === "string" ? fb.suggested_rewrite : "",
        corrections,
        insights: {
          linking: lw
            ? {
                score: lw.score ?? null,
                found: Array.isArray(lw.found) ? lw.found.map(String) : [],
                suggestions: Array.isArray(lw.suggestions) ? lw.suggestions.map(String) : [],
              }
            : null,
          repetitions,
          lexical,
          plagiarism:
            fb.plagiarism && (fb.plagiarism.score != null || fb.plagiarism.status)
              ? { score: fb.plagiarism.score ?? null, status: fb.plagiarism.status ?? "" }
              : null,
          cefr,
        },
      };
    }),
  };
}

export async function generateMetadata({ params }) {
  const p = await params;
  const token = String(p?.token || "");
  const share = await loadShare(token);
  if (!share) return { title: "Shared report — STRATUM.ai", robots: { index: false, follow: false } };

  const bands = share.tasks.map((d) => (d.band != null ? String(d.band.toFixed(1)) : "—")).join(" · ");
  const by = share.ref ? ` by @${share.ref}` : "";
  const title = `Shared IELTS report (${bands})${by}`;
  const description = "IELTS Writing analysis: criteria breakdown, Task 1 strategy, linguistic insights, and detailed corrections.";

  return {
    title,
    description,
    robots: { index: false, follow: false },
    openGraph: {
      title,
      description,
      images: ["/og-image.png"],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og-image.png"],
    },
  };
}

export default async function SharePage({ params }) {
  const p = await params;
  const token = String(p?.token || "");
  const share = await loadShare(token);
  if (!share) notFound();
  const { tasks, ref } = share;

  const hasT1 = tasks.some((t) => t.type === "TASK_1");
  const hasT2 = tasks.some((t) => t.type === "TASK_2");

  const publicBase = resolvePublicSiteOrigin();

  const qs = new URLSearchParams();
  if (ref) qs.set("ref", ref);
  qs.set("landing", "1");
  const landingHref = publicBase ? `${publicBase}/?${qs.toString()}` : `/?${qs.toString()}`;

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="mb-8 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.35em] text-white/60">STRATUM.ai</p>
            <h1 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">
              Shared IELTS Writing Analysis
              <span className="ml-2 text-white/40">{hasT1 && hasT2 ? "Task 1 + Task 2" : hasT1 ? "Task 1" : "Task 2"}</span>
            </h1>
            <p className="mt-2 max-w-2xl text-sm font-semibold text-white/70">
              Full analysis: criteria, strategy, insights, corrections, and improved essay.
            </p>
            {ref ? (
              <p className="mt-2 text-[12px] font-black uppercase tracking-widest text-white/55">
                Shared by <span className="text-white">@{ref}</span>
              </p>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            <a
              href={landingHref}
              className="inline-flex items-center justify-center rounded-2xl bg-white px-5 py-3 text-xs font-black uppercase tracking-widest text-slate-900 transition-all hover:bg-slate-100 active:scale-[0.98]"
              rel="noreferrer"
              target="_blank"
            >
              Try STRATUM
            </a>
            <a
              href={landingHref}
              className="inline-flex items-center justify-center rounded-2xl bg-white/10 px-5 py-3 text-xs font-black uppercase tracking-widest text-white transition-all hover:bg-white/15 active:scale-[0.98]"
              rel="noreferrer"
              target="_blank"
            >
              Website
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {tasks.map((t) => {
            const created = formatDate(t.createdAt);
            return (
              <section
                key={t.id}
                className="relative overflow-hidden rounded-[2.75rem] border border-white/10 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 p-6 shadow-2xl shadow-black/30 sm:p-8"
              >
                <div className="pointer-events-none absolute inset-0 opacity-60 [background:radial-gradient(700px_circle_at_10%_10%,rgba(99,102,241,0.35),transparent_50%),radial-gradient(900px_circle_at_90%_0%,rgba(244,63,94,0.25),transparent_55%)]" />

                <div className="relative z-10">
                  <div className="flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-6">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center rounded-xl px-3 py-1 text-[10px] font-black uppercase tracking-widest ${
                            t.type === "TASK_1" ? "bg-indigo-500/20 text-indigo-200" : "bg-rose-500/20 text-rose-200"
                          }`}
                        >
                          {t.type.replace("_", " ")}
                        </span>
                        {created && <span className="text-[11px] font-bold text-white/50">{created}</span>}
                      </div>

                      <div className="mt-4 flex items-end gap-3">
                        <div className="text-5xl font-black tracking-tighter sm:text-6xl">
                          {t.band != null ? t.band.toFixed(1) : "—"}
                        </div>
                        <div className="pb-2 text-sm font-black uppercase tracking-widest text-white/40">Band</div>
                      </div>

                    </div>

                    <div className="flex flex-wrap gap-2">
                      {scoreChip(t.type === "TASK_1" ? "TA" : "TR", t.criteria.task)}
                      {scoreChip("CC", t.criteria.cc)}
                      {scoreChip("LR", t.criteria.lr)}
                      {scoreChip("GRA", t.criteria.gra)}
                    </div>
                  </div>

                  <SharedReportDetails task={t} />
                </div>
              </section>
            );
          })}
        </div>

        <div className="mt-10 rounded-[2.5rem] border border-white/10 bg-white/5 p-6 text-center backdrop-blur-md sm:mt-12 sm:p-8">
          <p className="text-sm font-extrabold text-white">Want a report like this?</p>
          <p className="mt-2 text-[12px] font-semibold text-white/70">
            Paste your IELTS Writing Task 1 or Task 2 and get instant band score + corrections.
          </p>
          <div className="mt-5 flex flex-col items-center justify-center gap-2 sm:flex-row">
            <a
              href={landingHref}
              className="inline-flex w-full items-center justify-center rounded-2xl bg-white px-6 py-3 text-xs font-black uppercase tracking-widest text-slate-900 transition-all hover:bg-slate-100 active:scale-[0.98] sm:w-auto"
              rel="noreferrer"
              target="_blank"
            >
              Analyze my writing
            </a>
            <a
              href={landingHref}
              className="inline-flex w-full items-center justify-center rounded-2xl bg-white/10 px-6 py-3 text-xs font-black uppercase tracking-widest text-white transition-all hover:bg-white/15 active:scale-[0.98] sm:w-auto"
              rel="noreferrer"
              target="_blank"
            >
              Learn more
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}

