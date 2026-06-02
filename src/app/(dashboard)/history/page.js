import { safeAuth } from '@/lib/safeAuth';
import HistoryClientWrapper from '@/components/dashboard/HistoryClientWrapper';
import {
  formatHistoryDbError,
  getHistoryChecksForUser,
  HISTORY_PAGE_SIZE,
} from '@/lib/historyChecks';

export default async function HistoryPage() {
  const session = await safeAuth();
  if (!session?.user?.id) return null;

  let initialChecks = [];
  let initialMeta = {
    total: 0,
    page: 1,
    pageSize: HISTORY_PAGE_SIZE,
    totalPages: 0,
    sort: 'desc',
    q: '',
    minScore: 0,
  };
  let initialError = null;

  try {
    const result = await getHistoryChecksForUser(session.user.id, {
      page: 1,
      pageSize: HISTORY_PAGE_SIZE,
      sort: 'desc',
    });
    initialChecks = result.checks;
    initialMeta = result.meta;
  } catch (err) {
    console.error('[history page] DB error:', err);
    initialError = formatHistoryDbError(err);
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-0 py-4 sm:py-6 md:py-8">
      <h1
        data-testid="history-heading"
        className="text-xl sm:text-2xl md:text-3xl font-semibold tracking-tight text-slate-800 dark:text-slate-100 mb-4 sm:mb-6 md:mb-8"
      >
        My Archive
      </h1>
      <HistoryClientWrapper
        initialChecks={initialChecks}
        initialMeta={initialMeta}
        initialError={initialError}
      />
    </div>
  );
}
