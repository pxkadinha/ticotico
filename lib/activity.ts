import { SupabaseClient } from "@supabase/supabase-js";

interface ActivityOptions {
  supabase: SupabaseClient;
  familyId: string;
  userId: string;
  displayName: string;
  icon: string;
  /** Use {name} as a placeholder for the display name */
  content: string;
  action: string;
}

/**
 * Logs a family activity message to the chat.
 * Fails silently so it never blocks the primary action.
 */
export async function logActivity({
  supabase,
  familyId,
  userId,
  displayName,
  icon,
  content,
  action,
}: ActivityOptions): Promise<void> {
  try {
    const formatted = content.replace("{name}", displayName);
    await supabase.from("messages").insert({
      family_id: familyId,
      user_id: userId,
      content: formatted,
      type: "activity",
      metadata: { icon, action, display_name: displayName },
    });
  } catch {
    // Activity logging is best-effort — never throw
  }
}
