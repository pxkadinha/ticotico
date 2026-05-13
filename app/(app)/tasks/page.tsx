import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TaskForm } from "./task-form";
import { TasksBoard } from "./tasks-board";
import type { Task } from "@/types";
import { getT } from "@/lib/i18n/server";

export default async function TasksPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: member } = await supabase
    .from("family_members").select("family_id").eq("user_id", user.id).single();
  if (!member) redirect("/dashboard");

  const t = await getT();

  const { data: tasks } = await supabase
    .from("tasks").select("*").eq("family_id", member.family_id)
    .order("created_at", { ascending: false });

  const allTasks = (tasks ?? []) as Task[];
  const pending = allTasks.filter((x) => x.status !== "done");

  return (
    <div className="max-w-5xl mx-auto space-y-8 pt-4 md:pt-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t.tasks.title}</h1>
        <p className="text-muted-foreground mt-1">
          {t.tasks.pendingCount(pending.length)} · {t.tasks.doneCount(allTasks.length - pending.length)}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1" id="add-task">
          <Card className="border-0 shadow-sm scroll-mt-24">
            <CardHeader><CardTitle className="text-base">{t.tasks.newTask}</CardTitle></CardHeader>
            <CardContent><TaskForm /></CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <TasksBoard tasks={allTasks} />
        </div>
      </div>
    </div>
  );
}
