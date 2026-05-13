import webpush from "web-push";
import { createClient } from "@/lib/supabase/server";

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  /** Deep-link URL opened when the notification is tapped */
  url?: string;
}

/**
 * Send a web push notification to every family member *except* the sender.
 * Fails silently so it never breaks the primary action.
 */
export async function notifyFamily({
  familyId,
  senderUserId,
  payload,
}: {
  familyId: string;
  senderUserId: string;
  payload: PushPayload;
}): Promise<void> {
  try {
    const supabase = await createClient();

    // Fetch all subscriptions for this family, excluding the sender
    const { data: subs } = await supabase
      .from("push_subscriptions")
      .select("subscription")
      .eq("family_id", familyId)
      .neq("user_id", senderUserId);

    if (!subs?.length) return;

    const body = JSON.stringify(payload);

    await Promise.allSettled(
      subs.map((row) =>
        webpush.sendNotification(
          row.subscription as webpush.PushSubscription,
          body
        )
      )
    );
  } catch {
    // Best-effort — never throw
  }
}
