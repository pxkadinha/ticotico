"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { notifyFamily } from "@/lib/notifications/push";
import type { BabyLogType } from "@/types";

export async function addBabyLog(formData: FormData) {
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

  const type = formData.get("type") as BabyLogType;
  const notes = (formData.get("notes") as string) || null;
  const durationStr = formData.get("duration_minutes") as string;
  const duration = durationStr ? parseInt(durationStr) : null;

  // Build metadata based on type
  let metadata: Record<string, unknown> | null = null;
  if (type === "feed") {
    metadata = {
      feed_type: formData.get("feed_type") || "breast",
      amount_ml: formData.get("amount_ml")
        ? parseInt(formData.get("amount_ml") as string)
        : null,
    };
  } else if (type === "diaper") {
    metadata = {
      diaper_type: formData.get("diaper_type") || "wet",
    };
  } else if (type === "milestone") {
    metadata = {
      title: formData.get("milestone_title") || "Milestone",
    };
  }

  const timestampStr = formData.get("timestamp") as string;
  const timestamp = timestampStr ? new Date(timestampStr).toISOString() : new Date().toISOString();

  const { error } = await supabase.from("baby_logs").insert({
    family_id: member.family_id,
    logged_by: user.id,
    type,
    timestamp,
    duration_minutes: duration,
    notes,
    metadata,
  });

  if (error) throw new Error(error.message);

  const displayName = member.display_name ?? "Someone";
  const typeLabels: Record<BabyLogType, string> = {
    feed: "feeding 🍼",
    sleep: "sleep 😴",
    diaper: "diaper 👶",
    milestone: "milestone ⭐",
  };
  await notifyFamily({
    familyId: member.family_id,
    senderUserId: user.id,
    payload: {
      title: "Family Hub · Baby log 👶",
      body: `${displayName} logged ${typeLabels[type] ?? type}`,
      tag: "baby",
      url: "/baby",
    },
  });

  revalidatePath("/baby");
  revalidatePath("/dashboard");
}

export async function updateBabyLog(id: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const type = formData.get("type") as BabyLogType;
  const notes = (formData.get("notes") as string) || null;
  const durationStr = formData.get("duration_minutes") as string;
  const duration = durationStr ? parseInt(durationStr) : null;

  let metadata: Record<string, unknown> | null = null;
  if (type === "feed") {
    metadata = {
      feed_type: formData.get("feed_type") || "breast",
      amount_ml: formData.get("amount_ml")
        ? parseInt(formData.get("amount_ml") as string)
        : null,
    };
  } else if (type === "diaper") {
    metadata = { diaper_type: formData.get("diaper_type") || "wet" };
  } else if (type === "milestone") {
    metadata = { title: formData.get("milestone_title") || "Milestone" };
  }

  const timestampStr = formData.get("timestamp") as string;
  const timestamp = timestampStr ? new Date(timestampStr).toISOString() : undefined;

  const { error } = await supabase
    .from("baby_logs")
    .update({
      type,
      duration_minutes: duration,
      notes,
      metadata,
      ...(timestamp ? { timestamp } : {}),
    })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/baby");
  revalidatePath("/dashboard");
}

export async function deleteBabyLog(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("baby_logs").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/baby");
  revalidatePath("/dashboard");
}
