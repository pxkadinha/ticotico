"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ExpenseCategory, ExpenseType } from "@/types";

export async function addExpense(formData: FormData) {
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

  const { error } = await supabase.from("expenses").insert({
    family_id: member.family_id,
    user_id: user.id,
    amount: parseFloat(formData.get("amount") as string),
    type: formData.get("type") as ExpenseType,
    category: formData.get("category") as ExpenseCategory,
    description: (formData.get("description") as string) || null,
    date: formData.get("date") as string,
  });

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
