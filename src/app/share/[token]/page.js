export const revalidate = 3600;
export const runtime = "nodejs";

import { notFound } from "next/navigation";
import { loadShareReport } from "@/lib/loadShareReport";
import { verifyShareToken } from "@/lib/shareToken";
import { resolvePublicSiteOrigin } from "@/lib/publicSiteUrl";
import SharedReportDetails from "./SharedReportDetails";

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
    <span className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-slate-800">
      <span className="text-slate-500">{label}</span>
      <span className="text-slate-900">{shown}</span>
    </span>
  );
}

/** Metadata without DB — page load uses cached `loadShareReport` once. */
export async function generateMetadata({ params }) {
  const p = await params;
  const token = String(p?.token || "");
  const verified = verifyShareToken(token);
  if (!verified.ok) {
    return { title: "Shared report — STRATUM.ai", robots: { index: false, follow: false } };
  }

  const ref = verified.data.ref;
  const title = ref
    ? `Shared IELTS report — @${ref}`
    : "Shared IELTS report — STRATUM.ai";
  const description =
    "IELTS Writing analysis: criteria, lexical upgrade, corrections, and side-by-side draft vs academic rewrite.";

  return {
    title,
    description,
    robots: { index: false, follow: false },
    openGraph: { title, description, images: ["/og-image.png"] },
    twitter: { card: "summary_large_image", title, description, images: ["/og-image.png"] },
  };
}

export default async function SharePage({ params }) {
  const p = await params;
  const token = String(p?.token || "");
  const share = await loadShareReport(token);
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
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="mb-8 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.35em] text-slate-400">STRATUM.ai</p>
            <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
              Shared IELTS Writing Analysis
              <span className="ml-2 text-slate-400">
                {hasT1 && hasT2 ? "Task 1 + Task 2" : hasT1 ? "Task 1" : "Task 2"}
              </span>
            </h1>
            <p className="mt-2 max-w-2xl text-sm font-semibold text-slate-600">
              Full analysis: criteria, lexical upgrade, corrections, and Comparison Lab (draft vs rewrite).
            </p>
            {ref ? (
              <p className="mt-2 text-[12px] font-black uppercase tracking-widest text-slate-500">
                Shared by <span className="text-slate-900">@{ref}</span>
              </p>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            <a
              href={landingHref}
              className="inline-flex items-center justify-center rounded-2xl bg-indigo-600 px-5 py-3 text-xs font-black uppercase tracking-widest text-white transition-all hover:bg-indigo-500 active:scale-[0.98]"
              rel="noreferrer"
              target="_blank"
            >
              Try STRATUM
            </a>
            <a
              href={landingHref}
              className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-xs font-black uppercase tracking-widest text-slate-700 transition-all hover:bg-slate-50 active:scale-[0.98]"
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
                className="overflow-hidden rounded-[2.75rem] border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/60 sm:p-8"
              >
                <div>
                  <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-100 pb-6">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center rounded-xl px-3 py-1 text-[10px] font-black uppercase tracking-widest ${
                            t.type === "TASK_1" ? "bg-indigo-100 text-indigo-700" : "bg-rose-100 text-rose-700"
                          }`}
                        >
                          {t.type.replace("_", " ")}
                        </span>
                        {created && <span className="text-[11px] font-bold text-slate-400">{created}</span>}
                      </div>

                      <div className="mt-4 flex items-end gap-3">
                        <div className="text-5xl font-black tracking-tighter text-slate-900 sm:text-6xl">
                          {t.band != null ? t.band.toFixed(1) : "—"}
                        </div>
                        <div className="pb-2 text-sm font-black uppercase tracking-widest text-slate-400">Band</div>
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

        <div className="mt-10 rounded-[2.5rem] border border-slate-200 bg-white p-6 text-center shadow-sm sm:mt-12 sm:p-8">
          <p className="text-sm font-extrabold text-slate-900">Want a report like this?</p>
          <p className="mt-2 text-[12px] font-semibold text-slate-600">
            Paste your IELTS Writing Task 1 or Task 2 and get instant band score + corrections.
          </p>
          <div className="mt-5 flex flex-col items-center justify-center gap-2 sm:flex-row">
            <a
              href={landingHref}
              className="inline-flex w-full items-center justify-center rounded-2xl bg-indigo-600 px-6 py-3 text-xs font-black uppercase tracking-widest text-white transition-all hover:bg-indigo-500 active:scale-[0.98] sm:w-auto"
              rel="noreferrer"
              target="_blank"
            >
              Analyze my writing
            </a>
            <a
              href={landingHref}
              className="inline-flex w-full items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 px-6 py-3 text-xs font-black uppercase tracking-widest text-slate-700 transition-all hover:bg-slate-100 active:scale-[0.98] sm:w-auto"
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
