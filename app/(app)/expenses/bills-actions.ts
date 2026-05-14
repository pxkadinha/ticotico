"use server";

import { format } from "date-fns";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/activity";
import { notifyFamily } from "@/lib/notifications/push";
import type { ExpenseCategory, RecurringCadence } from "@/types";
import { advanceNextDueDate } from "@/lib/expenses/advance-recurring-due";

const CADENCES: RecurringCadence[] = ["weekly", "monthly", "yearly"];
const CATEGORIES: ExpenseCategory[] = [
  "food",
  "health",
  "home",
  "baby",
  "transport",
  "entertainment",
  "other",
];

function parseCadence(v: string): RecurringCadence {
  if (CADENCES.includes(v as RecurringCadence)) return v as RecurringCadence;
  throw new Error("Invalid cadence");
}

function parseCategory(v: string): ExpenseCategory {
  if (CATEGORIES.includes(v as ExpenseCategory)) return v as ExpenseCategory;
  throw new Error("Invalid category");
}

function parseReminderDaysBefore(formData: FormData): number {
  const raw = formData.get("reminder_days_before");
  if (raw === null || raw === "") return 1;
  const n = parseInt(String(raw), 10);
  if (Number.isNaN(n)) return 1;
  return Math.min(30, Math.max(0, n));
}

export async function addRecurringBill(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: member } = await supabase
    .from("family_members")
    .select("family_id")
    .eq("user_id", user.id)
    .single();
  if (!member) throw new Error("No family found");

  const title = (formData.get("title") as string)?.trim();
  if (!title) throw new Error("Title required");

  const amount = parseFloat(formData.get("amount") as string);
  if (Number.isNaN(amount) || amount <= 0) throw new Error("Invalid amount");

  const category = parseCategory(formData.get("category") as string);
  const cadence = parseCadence(formData.get("cadence") as string);
  const next_due_date = formData.get("next_due_date") as string;
  if (!next_due_date) throw new Error("Due date required");

  const reminder_days_before = parseReminderDaysBefore(formData);

  const notes = ((formData.get("notes") as string) || "").trim() || null;

  const { error } = await supabase.from("recurring_bills").insert({
    family_id: member.family_id,
    created_by: user.id,
    title,
    amount,
    category,
    cadence,
    next_due_date,
    reminder_days_before,
    notes,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/expenses");
}

export async function updateRecurringBill(id: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const title = (formData.get("title") as string)?.trim();
  if (!title) throw new Error("Title required");

  const amount = parseFloat(formData.get("amount") as string);
  if (Number.isNaN(amount) || amount <= 0) throw new Error("Invalid amount");

  const category = parseCategory(formData.get("category") as string);
  const cadence = parseCadence(formData.get("cadence") as string);
  const next_due_date = formData.get("next_due_date") as string;
  if (!next_due_date) throw new Error("Due date required");

  const reminder_days_before = parseReminderDaysBefore(formData);

  const notes = ((formData.get("notes") as string) || "").trim() || null;

  const { error } = await supabase
    .from("recurring_bills")
    .update({
      title,
      amount,
      category,
      cadence,
      next_due_date,
      reminder_days_before,
      notes,
    })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/expenses");
}

export async function deleteRecurringBill(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("recurring_bills").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/expenses");
}

export async function toggleRecurringBill(id: string, isActive: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("recurring_bills")
    .update({ is_active: isActive })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/expenses");
}

export async function markRecurringBillPaid(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: member } = await supabase
    .from("family_members")
    .select("family_id, display_name")
    .eq("user_id", user.id)
    .single();
  if (!member) throw new Error("No family found");

  const { data: bill, error: fetchErr } = await supabase
    .from("recurring_bills")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchErr || !bill) throw new Error(fetchErr?.message ?? "Bill not found");

  const today = format(new Date(), "yyyy-MM-dd");
  const desc = `Recurring: ${bill.title}`;

  const { error: insErr } = await supabase.from("expenses").insert({
    family_id: member.family_id,
    user_id: user.id,
    amount: Number(bill.amount),
    type: "expense",
    category: bill.category,
    description: desc,
    date: today,
  });

  if (insErr) throw new Error(insErr.message);

  const nextDue = advanceNextDueDate(bill.next_due_date, bill.cadence as RecurringCadence);

  const { error: updErr } = await supabase
    .from("recurring_bills")
    .update({
      next_due_date: nextDue,
      reminder_sent_for_due: null,
    })
    .eq("id", id);

  if (updErr) throw new Error(updErr.message);

  const displayName = member.display_name ?? "Someone";
  await logActivity({
    supabase,
    familyId: member.family_id,
    userId: user.id,
    displayName,
    icon: "📅",
    content: `{name} marked recurring bill "${bill.title}" paid`,
    action: "recurring_bill_paid",
  });

  await notifyFamily({
    familyId: member.family_id,
    senderUserId: user.id,
    payload: {
      title: "Family Hub · Bill paid",
      body: `${displayName} logged payment for "${bill.title}" (€${Number(bill.amount).toFixed(2)})`,
      tag: "recurring-bill",
      url: "/expenses",
    },
  });

  revalidatePath("/expenses");
  revalidatePath("/dashboard");
}
