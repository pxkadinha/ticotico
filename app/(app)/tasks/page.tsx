import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TaskForm } from "./task-form";
import { TaskItem } from "./task-item";
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
  const pending = allTasks.filter((t) => t.status !== "done");
  const done = allTasks.filter((t) => t.status === "done");

  const high = pending.filter((t) => t.priority === "high");
  const medium = pending.filter((t) => t.priority === "medium");
  const low = pending.filter((t) => t.priority === "low");

  return (
    <div className="max-w-5xl mx-auto space-y-8 pt-4 md:pt-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t.tasks.title}</h1>
        <p className="text-muted-foreground mt-1">
          {t.tasks.pendingCount(pending.length)} · {t.tasks.doneCount(done.length)}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card className="border-0 shadow-sm">
            <CardHeader><CardTitle className="text-base">{t.tasks.newTask}</CardTitle></CardHeader>
            <CardContent><TaskForm /></CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Tabs defaultValue="pending">
            <TabsList className="mb-4 bg-muted">
              <TabsTrigger value="pending">{t.tasks.pending(pending.length)}</TabsTrigger>
              <TabsTrigger value="done">{t.tasks.done(done.length)}</TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="space-y-4">
              {pending.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <p className="text-4xl mb-3">🎉</p>
                  <p>{t.tasks.allCaughtUp}</p>
                </div>
              ) : (
                <>
                  {high.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-red-500 uppercase tracking-wide mb-2 px-1">{t.tasks.highPriority}</p>
                      <div className="space-y-2">{high.map((task) => <TaskItem key={task.id} task={task} />)}</div>
                    </div>
                  )}
                  {medium.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-amber-500 uppercase tracking-wide mb-2 px-1">{t.tasks.mediumPriority}</p>
                      <div className="space-y-2">{medium.map((task) => <TaskItem key={task.id} task={task} />)}</div>
                    </div>
                  )}
                  {low.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 px-1">{t.tasks.lowPriority}</p>
                      <div className="space-y-2">{low.map((task) => <TaskItem key={task.id} task={task} />)}</div>
                    </div>
                  )}
                </>
              )}
            </TabsContent>

            <TabsContent value="done" className="space-y-2">
              {done.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">{t.tasks.noCompleted}</div>
              ) : (
                done.map((task) => <TaskItem key={task.id} task={task} />)
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
