"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function addAppointment(formData: FormData) {
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

  const date = formData.get("date") as string;
  const time = formData.get("time") as string;
  const endTime = formData.get("end_time") as string;
  const allDay = formData.get("all_day") === "true";

  const startTime = allDay ? `${date}T00:00:00` : `${date}T${time}:00`;
  const endTimeFull = endTime ? `${date}T${endTime}:00` : null;

  const { error } = await supabase.from("appointments").insert({
    family_id: member.family_id,
    created_by: user.id,
    title: formData.get("title") as string,
    description: (formData.get("description") as string) || null,
    location: (formData.get("location") as string) || null,
    start_time: startTime,
    end_time: endTimeFull,
    all_day: allDay,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/calendar");
  revalidatePath("/dashboard");
}

export async function deleteAppointment(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("appointments")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/calendar");
  revalidatePath("/dashboard");
}
