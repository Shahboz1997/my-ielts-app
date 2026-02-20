import { auth } from "@/app/api/auth/[...nextauth]/route";
import { getPrisma } from "@/lib/prisma";
import HistoryClientWrapper from "@/components/dashboard/HistoryClientWrapper";

export default async function HistoryPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const prisma = getPrisma();
  const initialChecks = await prisma.check.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="w-full max-w-7xl mx-auto px-0 py-4 sm:py-6 md:py-8">
      <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold tracking-tight text-slate-800 dark:text-slate-100 mb-4 sm:mb-6 md:mb-8">
        My Archive
      </h1>
      <HistoryClientWrapper initialData={initialChecks} />
    </div>
  );
}
