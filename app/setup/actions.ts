"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function setupFamily(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const displayName = (formData.get("displayName") as string).trim();
  const familyName =
    (formData.get("familyName") as string).trim() ||
    `${displayName}'s Family`;

  // Guard: don't create a second family if one already exists.
  const { data: existing } = await supabase
    .from("family_members")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    redirect("/dashboard");
  }

  // Generate the family id client-side so we don't need to SELECT after insert
  // (which would fail the SELECT policy before family_members exists).
  const { randomUUID } = await import("crypto");
  const familyId = randomUUID();

  const { error: familyError } = await supabase
    .from("families")
    .insert({ id: familyId, name: familyName });

  if (familyError) {
    return { error: "Could not create family: " + familyError.message };
  }

  const { error: memberError } = await supabase
    .from("family_members")
    .insert({
      family_id: familyId,
      user_id: user.id,
      role: "admin",
      display_name: displayName,
    });

  if (memberError) {
    return { error: "Could not set up family: " + memberError.message };
  }

  redirect("/dashboard");
}
