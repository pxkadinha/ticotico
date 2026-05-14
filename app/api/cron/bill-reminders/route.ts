/**
 * Recurring bill push reminders (trusted server only).
 *
 * Auth (same value as env `CRON_SECRET`):
 *   Preferred: `Authorization: Bearer <CRON_SECRET>`
 *   Fallback: `GET /api/cron/bill-reminders?token=<CRON_SECRET>` (for free URL-only ping/cron tools;
 *   tokens may appear in HTTP access logs — use a long random secret.)
 *
 * Schedulers (no Vercel Cron required): GitHub Actions `schedule` + curl with Bearer;
 * cron-job.org / similar if they support custom headers or the `token` query.
 */

import { NextRequest, NextResponse } from "next/server";
import { format, isAfter, isBefore, parseISO, subDays } from "date-fns";
import { createServiceClient } from "@/lib/supabase/admin";
import { notifyFamilyBroadcast } from "@/lib/notifications/push";

type BillRow = {
  id: string;
  family_id: string;
  title: string;
  next_due_date: string;
  reminder_days_before: number;
  reminder_sent_for_due: string | null;
};

function billsInReminderWindow(bills: BillRow[] | null, todayStr: string) {
  const todayD = parseISO(`${todayStr}T12:00:00`);

  return (bills ?? []).filter((bill) => {
    const due = bill.next_due_date;
    const daysBefore = Math.min(30, Math.max(0, Number(bill.reminder_days_before) || 0));
    const dueD = parseISO(`${due}T12:00:00`);
    const windowStart = subDays(dueD, daysBefore);
    if (isBefore(todayD, windowStart) || isAfter(todayD, dueD)) return false;
    if (bill.reminder_sent_for_due === due) return false;
    return true;
  });
}

async function run(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 503 });
  }
  const auth = req.headers.get("authorization");
  const bearer = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  const queryToken = new URL(req.url).searchParams.get("token");
  const authorized = bearer === secret || queryToken === secret;
  if (!authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let supabase: ReturnType<typeof createServiceClient>;
  try {
    supabase = createServiceClient();
  } catch {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 503 });
  }

  const todayStr = format(new Date(), "yyyy-MM-dd");

  const { data: bills, error } = await supabase
    .from("recurring_bills")
    .select(
      "id, family_id, title, next_due_date, reminder_days_before, reminder_sent_for_due"
    )
    .eq("is_active", true);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const dueSoon = billsInReminderWindow(bills as BillRow[] | null, todayStr);

  let processed = 0;
  for (const bill of dueSoon) {
    const due = bill.next_due_date;
    const safeTitle = bill.title.replace(/"/g, "'");

    await notifyFamilyBroadcast({
      familyId: bill.family_id,
      payload: {
        title: "Family Hub · Bill reminder",
        body: `${safeTitle} — due ${due}`,
        tag: `bill-reminder-${bill.id}-${due}`,
        url: "/expenses",
      },
    });

    const { error: updErr } = await supabase
      .from("recurring_bills")
      .update({ reminder_sent_for_due: due })
      .eq("id", bill.id);

    if (!updErr) processed += 1;
  }

  return NextResponse.json({
    ok: true,
    processed,
    matched: dueSoon.length,
    activeBills: bills?.length ?? 0,
  });
}

export async function GET(req: NextRequest) {
  return run(req);
}

export async function POST(req: NextRequest) {
  return run(req);
}
