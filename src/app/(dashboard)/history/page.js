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
    <div className="max-w-5xl mx-auto py-8">
      <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-800 mb-8">
        My Archive
      </h1>
      <HistoryClientWrapper initialData={initialChecks} />
    </div>
  );
}
