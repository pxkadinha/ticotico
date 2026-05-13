import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TaskForm } from "./task-form";
import { TaskItem } from "./task-item";
import type { Task } from "@/types";

export default async function TasksPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: member } = await supabase
    .from("family_members")
    .select("family_id")
    .eq("user_id", user.id)
    .single();
  if (!member) redirect("/dashboard");

  const { data: tasks } = await supabase
    .from("tasks")
    .select("*")
    .eq("family_id", member.family_id)
    .order("created_at", { ascending: false });

  const allTasks = (tasks ?? []) as Task[];
  const pending = allTasks.filter((t) => t.status !== "done");
  const done = allTasks.filter((t) => t.status === "done");

  const high = pending.filter((t) => t.priority === "high");
  const medium = pending.filter((t) => t.priority === "medium");
  const low = pending.filter((t) => t.priority === "low");

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
        <p className="text-gray-500 mt-1">
          {pending.length} pending · {done.length} done
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-1">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">New task</CardTitle>
            </CardHeader>
            <CardContent>
              <TaskForm />
            </CardContent>
          </Card>
        </div>

        {/* Task list */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="pending">
            <TabsList className="mb-4 bg-gray-100">
              <TabsTrigger value="pending">
                Pending ({pending.length})
              </TabsTrigger>
              <TabsTrigger value="done">Done ({done.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="space-y-4">
              {pending.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <p className="text-4xl mb-3">🎉</p>
                  <p>All caught up! Add a new task to get started.</p>
                </div>
              ) : (
                <>
                  {high.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-red-500 uppercase tracking-wide mb-2 px-1">
                        High priority
                      </p>
                      <div className="space-y-2">
                        {high.map((t) => (
                          <TaskItem key={t.id} task={t} />
                        ))}
                      </div>
                    </div>
                  )}
                  {medium.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-amber-500 uppercase tracking-wide mb-2 px-1">
                        Medium priority
                      </p>
                      <div className="space-y-2">
                        {medium.map((t) => (
                          <TaskItem key={t.id} task={t} />
                        ))}
                      </div>
                    </div>
                  )}
                  {low.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-1">
                        Low priority
                      </p>
                      <div className="space-y-2">
                        {low.map((t) => (
                          <TaskItem key={t.id} task={t} />
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </TabsContent>

            <TabsContent value="done" className="space-y-2">
              {done.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  No completed tasks yet.
                </div>
              ) : (
                done.map((t) => <TaskItem key={t.id} task={t} />)
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
