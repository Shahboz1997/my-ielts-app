export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { safeAuth } from "@/lib/safeAuth";
import { getPrisma } from "@/lib/prisma";
import { isAdminEmail } from "@/lib/admin";
import {
  clampCreditsAdminManual,
  normalizeCreditsBalance,
} from "@/lib/credits";
import { DEPOSIT_STATUSES } from "@/lib/deposits";
import { sendDepositCreditedUserEmail } from "@/lib/resendMail";

/**
 * Admin: set or increment user credits.
 *
 * Body options:
 * - { email | userId, credits } — set absolute balance
 * - { email | userId, increment, depositId? } — add credits; optionally mark DepositRequest credited
 */
export async function POST(request) {
  const session = await safeAuth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const prisma = getPrisma();
  const actor = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true },
  });
  if (!actor?.email || !isAdminEmail(actor.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const rawEmail = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const rawUserId = typeof body?.userId === "string" ? body.userId.trim() : "";
  const depositId =
    typeof body?.depositId === "string" && body.depositId.trim()
      ? body.depositId.trim()
      : null;
  const adminNote =
    typeof body?.adminNote === "string" ? body.adminNote.trim().slice(0, 500) : null;

  if (rawEmail && rawUserId) {
    return NextResponse.json(
      { error: "Provide only one of email or userId" },
      { status: 400 }
    );
  }
  if (!rawEmail && !rawUserId) {
    return NextResponse.json(
      { error: "Missing target: email or userId" },
      { status: 400 }
    );
  }

  const hasIncrement = body?.increment != null && body?.increment !== "";
  const hasCredits = body?.credits != null && body?.credits !== "";

  if (hasIncrement && hasCredits) {
    return NextResponse.json(
      { error: "Provide only one of credits or increment" },
      { status: 400 }
    );
  }
  if (!hasIncrement && !hasCredits) {
    return NextResponse.json(
      { error: "Missing credits or increment" },
      { status: 400 }
    );
  }

  try {
    const where = rawUserId ? { id: rawUserId } : { email: rawEmail };
    const existing = await prisma.user.findUnique({
      where,
      select: { id: true, email: true, name: true, credits: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let deposit = null;
    if (depositId) {
      deposit = await prisma.depositRequest.findUnique({
        where: { id: depositId },
      });
      if (!deposit) {
        return NextResponse.json({ error: "Deposit not found" }, { status: 404 });
      }
      if (deposit.userId !== existing.id) {
        return NextResponse.json(
          { error: "Deposit does not belong to this user" },
          { status: 400 }
        );
      }
      if (deposit.status === DEPOSIT_STATUSES.CREDITED) {
        return NextResponse.json(
          { error: "Deposit already credited", depositId },
          { status: 409 }
        );
      }
    }

    const current = normalizeCreditsBalance(existing.credits);
    let nextCredits;
    let added = 0;

    if (hasIncrement) {
      const rawInc = Math.round(Number(body.increment));
      if (!Number.isFinite(rawInc) || rawInc === 0) {
        return NextResponse.json({ error: "Invalid increment" }, { status: 400 });
      }
      // When linking a deposit claim, always use the pack size from the deposit row.
      added = deposit ? deposit.credits : rawInc;
      nextCredits = clampCreditsAdminManual(current + added);
      added = nextCredits - current;
    } else {
      nextCredits = clampCreditsAdminManual(body.credits);
      added = nextCredits - current;
    }

    const updated = await prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: existing.id },
        data: { credits: nextCredits },
        select: { id: true, email: true, name: true, credits: true },
      });

      let updatedDeposit = null;
      if (deposit) {
        updatedDeposit = await tx.depositRequest.update({
          where: { id: deposit.id },
          data: {
            status: DEPOSIT_STATUSES.CREDITED,
            creditedAt: new Date(),
            ...(adminNote ? { adminNote } : {}),
          },
        });
      }

      return { user, updatedDeposit };
    });

    if (deposit && added > 0) {
      void sendDepositCreditedUserEmail({
        to: updated.user.email,
        name: updated.user.name,
        packName: deposit.packName,
        credits: added,
        newBalance: updated.user.credits,
      });
    }

    return NextResponse.json(
      {
        ok: true,
        user: {
          id: updated.user.id,
          email: updated.user.email,
          credits: updated.user.credits,
        },
        added,
        deposit: updated.updatedDeposit
          ? {
              id: updated.updatedDeposit.id,
              status: updated.updatedDeposit.status,
              creditedAt: updated.updatedDeposit.creditedAt,
            }
          : null,
      },
      { status: 200 }
    );
  } catch (e) {
    if (e?.code === "P2025") {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    console.error("[/api/admin/credits]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
