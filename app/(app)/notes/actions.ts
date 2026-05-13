"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createNote(formData: FormData) {
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

  const tagsRaw = (formData.get("tags") as string) ?? "";
  const tags = tagsRaw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  const { error } = await supabase.from("notes").insert({
    family_id: member.family_id,
    created_by: user.id,
    title: formData.get("title") as string,
    content: (formData.get("content") as string) || null,
    tags,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/notes");
}

export async function updateNote(
  id: string,
  title: string,
  content: string,
  tags: string[]
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("notes")
    .update({ title, content, tags })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/notes");
}

export async function deleteNote(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("notes").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/notes");
}
