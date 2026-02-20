import { auth } from "@/app/api/auth/[...nextauth]/route";
import { getPrisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import AnalyticalLab from "@/components/dashboard/AnalyticalLab";

export default async function HistoryDetailPage({ params }) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const resolved = await params;
  const id = typeof resolved?.id === 'string' ? resolved.id : resolved?.id?.[0];
  if (!id) notFound();

  const prisma = getPrisma();

  const check = await prisma.check.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!check) notFound();

  return <AnalyticalLab check={check} />;
}
