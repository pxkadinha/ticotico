"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { TaskStatus, TaskPriority, TaskRecurrence } from "@/types";

export async function addTask(formData: FormData) {
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

  const dueDate = formData.get("due_date") as string;
  const assignedTo = formData.get("assigned_to") as string;

  const { error } = await supabase.from("tasks").insert({
    family_id: member.family_id,
    created_by: user.id,
    assigned_to: assignedTo || null,
    title: formData.get("title") as string,
    description: (formData.get("description") as string) || null,
    priority: (formData.get("priority") as TaskPriority) || "medium",
    due_date: dueDate || null,
    recurrence: (formData.get("recurrence") as TaskRecurrence) || "none",
  });

  if (error) throw new Error(error.message);
  revalidatePath("/tasks");
  revalidatePath("/dashboard");
}

export async function updateTaskStatus(id: string, status: TaskStatus) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("tasks")
    .update({ status })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/tasks");
  revalidatePath("/dashboard");
}

export async function deleteTask(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/tasks");
  revalidatePath("/dashboard");
}
