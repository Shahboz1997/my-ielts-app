import { safeAuth } from "@/lib/safeAuth";
import { getHistoryCheckForUser } from "@/lib/historyChecks";
import { notFound } from "next/navigation";
import AnalyticalLabClient from "./AnalyticalLabClient";

export default async function HistoryDetailPage({ params }) {
  const session = await safeAuth();
  if (!session?.user?.id) return null;

  const resolved = await params;
  const id = typeof resolved?.id === 'string' ? resolved.id : resolved?.id?.[0];
  if (!id) notFound();

  let check = null;
  try {
    check = await getHistoryCheckForUser(session.user.id, id);
  } catch (err) {
    console.error("History detail DB error:", err);
    notFound();
  }
  if (!check) notFound();

  return <AnalyticalLabClient check={check} />;
}
