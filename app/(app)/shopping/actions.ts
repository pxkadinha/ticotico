"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { logActivity } from "@/lib/activity";

export async function createShoppingList(formData: FormData) {
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

  const title = formData.get("title") as string;

  const { error } = await supabase.from("shopping_lists").insert({
    family_id: member.family_id,
    created_by: user.id,
    title,
  });

  if (error) throw new Error(error.message);

  await logActivity({
    supabase,
    familyId: member.family_id,
    userId: user.id,
    displayName: member.display_name ?? "Someone",
    icon: "🛒",
    content: `{name} created shopping list "${title}"`,
    action: "shopping_list_created",
  });

  revalidatePath("/shopping");
}

export async function deleteShoppingList(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("shopping_lists")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/shopping");
}

export async function addShoppingItem(listId: string, name: string, quantity?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase.from("shopping_items").insert({
    list_id: listId,
    name,
    quantity: quantity || null,
    added_by: user.id,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/shopping");
}

export async function toggleShoppingItem(id: string, checked: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("shopping_items")
    .update({ checked })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/shopping");
}

export async function deleteShoppingItem(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("shopping_items")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/shopping");
}
