"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { EnabledModules } from "@/types";

export async function regenerateInviteToken(familyId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("families")
    .update({ invite_token: crypto.randomUUID() })
    .eq("id", familyId);

  if (error) throw new Error(error.message);
  revalidatePath("/settings");
}

export async function updateEnabledModules(modules: EnabledModules) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase.rpc("set_family_modules", { p_modules: modules });
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
}
