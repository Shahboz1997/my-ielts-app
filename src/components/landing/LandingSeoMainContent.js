import Link from 'next/link';
import {
  LANDING_FAQ_ITEMS,
  LANDING_FEATURES,
  LANDING_HERO,
  LANDING_WORKFLOW_STEPS,
} from '@/lib/landingSeoData';
import LandingAbOfferLine from '@/components/landing/LandingAbOfferLine';
import LandingSeoSignInButton from '@/components/landing/LandingSeoSignInButton';

/**
 * Server-rendered marketing HTML for crawlers and first paint (SEO).
 * Interactive animations live in LandingPage (client), loaded separately.
 */
export default function LandingSeoMainContent() {
  return (
    <article className="bg-[#F9FAFB] text-slate-900 dark:bg-[#050505] dark:text-slate-100">
      <header className="border-b border-slate-200/80 dark:border-white/10 px-4 py-14 sm:py-20">
        <div className="mx-auto max-w-4xl text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
            {LANDING_HERO.tagline}
          </p>
          <h1 className="text-3xl font-black uppercase tracking-tight sm:text-5xl md:text-6xl">
            {LANDING_HERO.title}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-slate-600 dark:text-slate-300 sm:text-lg">
            {LANDING_HERO.description}
          </p>
          <LandingAbOfferLine className="mx-auto mt-4 max-w-xl text-sm font-medium text-slate-500 dark:text-slate-400" />
          <nav className="mt-8 flex flex-wrap items-center justify-center gap-3" aria-label="Primary actions">
            <a
              href="/?app=1"
              className="inline-flex rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white hover:bg-indigo-500"
            >
              Try demo check
            </a>
            <LandingSeoSignInButton className="inline-flex rounded-xl border border-slate-300 px-6 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800" />
          </nav>
        </div>
      </header>

      <section className="border-b border-slate-200/80 px-4 py-12 dark:border-white/10" aria-labelledby="features-heading">
        <div className="mx-auto max-w-5xl">
          <h2 id="features-heading" className="text-center text-2xl font-black uppercase tracking-tight">
            Why STRATUM for IELTS Writing
          </h2>
          <ul className="mt-8 grid gap-6 sm:grid-cols-2">
            {LANDING_FEATURES.map((f) => (
              <li
                key={f.title}
                className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900/60"
              >
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{f.description}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="border-b border-slate-200/80 px-4 py-12 dark:border-white/10" aria-labelledby="workflow-heading">
        <div className="mx-auto max-w-5xl">
          <h2 id="workflow-heading" className="text-center text-2xl font-black uppercase tracking-tight">
            How it works
          </h2>
          <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {LANDING_WORKFLOW_STEPS.map((step) => (
              <li
                key={step.step}
                className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900/60"
              >
                <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                  Step {step.step}
                </span>
                <h3 className="mt-2 font-bold text-slate-900 dark:text-white">{step.title}</h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{step.description}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section
        id="faq"
        className="border-b border-slate-200/80 px-4 py-12 dark:border-white/10"
        aria-labelledby="faq-heading"
      >
        <div className="mx-auto max-w-3xl">
          <h2 id="faq-heading" className="text-center text-2xl font-black uppercase tracking-tight">
            Frequently asked questions
          </h2>
          <div className="mt-8 space-y-3">
            {LANDING_FAQ_ITEMS.map((item) => (
              <details
                key={item.q}
                className="group rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900/60"
              >
                <summary className="cursor-pointer list-none font-bold text-slate-900 dark:text-white [&::-webkit-details-marker]:hidden">
                  {item.q}
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-10 text-center">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Ready to practice?{' '}
          <Link href="/?app=1" className="font-bold text-indigo-600 hover:underline dark:text-indigo-400">
            Open the writing workspace
          </Link>{' '}
          or{' '}
          <Link href="/landing" className="font-bold text-indigo-600 hover:underline dark:text-indigo-400">
            view the full interactive tour
          </Link>
          .
        </p>
      </section>
    </article>
  );
}
