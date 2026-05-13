"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { logActivity } from "@/lib/activity";
import { notifyFamily } from "@/lib/notifications/push";
import type { ExpenseCategory, ExpenseType } from "@/types";

export async function addExpense(formData: FormData) {
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

  const amount = parseFloat(formData.get("amount") as string);
  const type = formData.get("type") as ExpenseType;
  const description = (formData.get("description") as string) || null;

  const { error } = await supabase.from("expenses").insert({
    family_id: member.family_id,
    user_id: user.id,
    amount,
    type,
    category: formData.get("category") as ExpenseCategory,
    description,
    date: formData.get("date") as string,
  });

  if (error) throw new Error(error.message);

  const displayName = member.display_name ?? "Someone";
  const label = description ? `"${description}"` : `€${amount.toFixed(2)}`;
  const icon = type === "income" ? "💰" : "💸";
  await logActivity({
    supabase,
    familyId: member.family_id,
    userId: user.id,
    displayName,
    icon,
    content: `{name} added ${type} of ${label}`,
    action: "expense_added",
  });

  await notifyFamily({
    familyId: member.family_id,
    senderUserId: user.id,
    payload: {
      title: `Family Hub · ${type === "income" ? "Income 💰" : "Expense 💸"}`,
      body: `${displayName} added ${type} of ${label}`,
      tag: "expense",
      url: "/expenses",
    },
  });

  revalidatePath("/expenses");
  revalidatePath("/dashboard");
}

export async function updateExpense(id: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const amount = parseFloat(formData.get("amount") as string);
  const type = formData.get("type") as ExpenseType;

  const { error } = await supabase
    .from("expenses")
    .update({
      amount,
      type,
      category: formData.get("category") as ExpenseCategory,
      description: (formData.get("description") as string) || null,
      date: formData.get("date") as string,
    })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/expenses");
  revalidatePath("/dashboard");
}

export async function deleteExpense(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("expenses").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/expenses");
  revalidatePath("/dashboard");
}
