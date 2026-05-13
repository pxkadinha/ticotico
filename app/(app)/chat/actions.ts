"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function sendMessage(content: string): Promise<void> {
  const trimmed = content.trim();
  if (!trimmed) return;

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

  const { error } = await supabase.from("messages").insert({
    family_id: member.family_id,
    user_id: user.id,
    content: trimmed,
    type: "text",
    metadata: { display_name: member.display_name ?? user.email?.split("@")[0] ?? "?" },
  });

  if (error) throw new Error(error.message);
  revalidatePath("/chat");
}
