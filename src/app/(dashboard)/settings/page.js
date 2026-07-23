// Settings page — profile/account management only. No theme logic (no setTheme, no useEffect that changes theme).
import { safeAuth } from "@/lib/safeAuth";
import { getPrisma } from "@/lib/prisma";
import SettingsClient from "./SettingsClient";

export default async function SettingsPage() {
  const session = await safeAuth();
  if (!session?.user) return null;

  let reminders = null;
  let deposits = [];
  try {
    const prisma = getPrisma();
    const [userRow, depositRows] = await Promise.all([
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          practiceRemindersEnabled: true,
          practiceReminderHour: true,
          practiceReminderMinute: true,
          practiceReminderTimezone: true,
          practiceReminderDays: true,
          credits: true,
        },
      }),
      prisma.depositRequest.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          id: true,
          packId: true,
          packName: true,
          credits: true,
          amountUsd: true,
          currency: true,
          status: true,
          createdAt: true,
          creditedAt: true,
        },
      }),
    ]);
    reminders = userRow;
    deposits = depositRows.map((d) => ({
      ...d,
      createdAt: d.createdAt.toISOString(),
      creditedAt: d.creditedAt ? d.creditedAt.toISOString() : null,
    }));
  } catch {
    reminders = null;
    deposits = [];
  }

  return (
    <div className="py-6">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 mb-6">
        Account settings
      </h1>
      <SettingsClient
        user={{ ...session.user, credits: reminders?.credits ?? session.user?.credits }}
        reminders={reminders}
        deposits={deposits}
      />
    </div>
  );
}
