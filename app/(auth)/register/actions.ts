"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { randomUUID } from "crypto";

export async function registerAction(formData: FormData) {
  const supabase = await createClient();

  const displayName = (formData.get("displayName") as string).trim();
  const familyName =
    (formData.get("familyName") as string).trim() ||
    `${displayName}'s Family`;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (password.length < 6) {
    return { error: "Password must be at least 6 characters" };
  }

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName,
        family_name: familyName,
      },
    },
  });

  if (authError) {
    return { error: authError.message };
  }

  if (!authData.user) {
    return { error: "Something went wrong. Please try again." };
  }

  // Session present = email confirmation disabled → create family now
  if (authData.session) {
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
        user_id: authData.user.id,
        role: "admin",
        display_name: displayName,
      });

    if (memberError) {
      return { error: "Could not set up family: " + memberError.message };
    }

    redirect("/dashboard");
  }

  // No session = email confirmation required
  // Family will be created in /auth/callback
  return { awaitingConfirmation: true as const, email };
}
