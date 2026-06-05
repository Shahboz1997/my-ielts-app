import Link from 'next/link';
import { getQuizForCampaign } from '@/lib/telegramQuiz';
import { STRATUM_SITE } from '@/lib/telegramDailyContent';
import { TELEGRAM_CHANNEL_LABEL, TELEGRAM_CHANNEL_URL } from '@/lib/support';

export const metadata = {
  title: 'Quiz breakdown | STRATUM IELTS Writing',
  description: 'Full breakdown of the evening Telegram quiz for IELTS Writing.',
};

export default async function TelegramQuizPage({ searchParams }) {
  const sp = await searchParams;
  const id = typeof sp?.id === 'string' ? sp.id : '';
  const quiz = getQuizForCampaign(id);

  if (!quiz) {
    return (
      <main className="mx-auto max-w-lg px-4 py-12">
        <h1 className="text-2xl font-bold mb-4">Quiz breakdown</h1>
        <p className="text-neutral-600 mb-6">
          Quiz not found. Open the link from the evening post on the{' '}
          <a href={TELEGRAM_CHANNEL_URL} className="text-indigo-600 underline">
            Startum Telegram channel
          </a>
          .
        </p>
        <Link
          href="/"
          className="inline-block rounded-lg bg-neutral-900 px-5 py-3 text-white font-medium"
        >
          ✍️ Check your essay on the site
        </Link>
      </main>
    );
  }

  const correct = quiz.options[quiz.correctOptionId];

  return (
    <main className="mx-auto max-w-lg px-4 py-12">
      <p className="text-sm text-neutral-500 mb-2">🌙 Evening warm-up · IELTS Writing</p>
      <h1 className="text-2xl font-bold mb-6">{quiz.question}</h1>

      <section className="mb-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500 mb-3">
          Options
        </h2>
        <ul className="space-y-2">
          {quiz.options.map((opt, i) => (
            <li
              key={opt}
              className={`rounded-lg border px-4 py-3 ${
                i === quiz.correctOptionId
                  ? 'border-green-500 bg-green-50 font-medium'
                  : 'border-neutral-200'
              }`}
            >
              {i === quiz.correctOptionId ? '✅ ' : ''}
              {opt}
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-8 rounded-xl bg-neutral-100 p-5">
        <h2 className="font-semibold mb-2">Correct answer</h2>
        <p className="text-lg mb-3">{correct}</p>
        <p className="text-neutral-700 leading-relaxed">{quiz.explanation}</p>
      </section>

      <Link
        href="/"
        className="inline-block w-full text-center rounded-lg bg-neutral-900 px-5 py-3 text-white font-medium"
      >
        👉 Check your essay with the AI examiner
      </Link>

      <p className="mt-6 text-center text-sm text-neutral-500">
        <a href={TELEGRAM_CHANNEL_URL} className="underline hover:text-indigo-600">
          {TELEGRAM_CHANNEL_LABEL}
        </a>
        {' · '}
        <a href={STRATUM_SITE} className="underline hover:text-indigo-600">
          startum-writing-ai.vercel.app
        </a>
      </p>
    </main>
  );
}
