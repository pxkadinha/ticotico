"use client";

import { useMemo, useState } from "react";
import { Download, Search } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button, buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { TaskItem } from "./task-item";
import type { Task } from "@/types";
import { useLanguage } from "@/components/providers/language-provider";
import { cn } from "@/lib/utils";

function exportTasksCsv(tasks: Task[], filename: string) {
  const rows = [
    ["Title", "Status", "Priority", "Due date", "Description"],
    ...tasks.map((x) => [
      x.title,
      x.status,
      x.priority,
      x.due_date ?? "",
      x.description ?? "",
    ]),
  ];
  const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function TasksBoard({ tasks }: { tasks: Task[] }) {
  const { t } = useLanguage();
  const [search, setSearch] = useState("");

  const { pending, done } = useMemo(() => {
    const p = tasks.filter((x) => x.status !== "done");
    const d = tasks.filter((x) => x.status === "done");
    return { pending: p, done: d };
  }, [tasks]);

  const filterBySearch = (list: Task[]) => {
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (x) =>
        x.title.toLowerCase().includes(q) ||
        (x.description ?? "").toLowerCase().includes(q)
    );
  };

  const pendingFiltered = filterBySearch(pending);
  const doneFiltered = filterBySearch(done);

  const high = pendingFiltered.filter((x) => x.priority === "high");
  const medium = pendingFiltered.filter((x) => x.priority === "medium");
  const low = pendingFiltered.filter((x) => x.priority === "low");

  const flatPending =
    search.trim() ? pendingFiltered : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.tasks.searchPlaceholder}
            className="pl-9"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2 shrink-0"
          onClick={() => exportTasksCsv(tasks, "family-hub-tasks.csv")}
        >
          <Download className="w-4 h-4" />
          {t.tasks.exportCsv}
        </Button>
      </div>

      <Tabs defaultValue="pending">
        <TabsList className="bg-muted">
          <TabsTrigger value="pending">{t.tasks.pending(pending.length)}</TabsTrigger>
          <TabsTrigger value="done">{t.tasks.done(done.length)}</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4 mt-4">
          {pending.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground space-y-4">
              <p className="text-4xl">🎉</p>
              <p>{t.tasks.allCaughtUp}</p>
              <Link
                href="#add-task"
                className={cn(
                  buttonVariants({ variant: "default", size: "default" }),
                  "bg-rose-500 hover:bg-rose-600 text-white border-0"
                )}
              >
                {t.tasks.addFirstCta}
              </Link>
            </div>
          ) : flatPending ? (
            flatPending.length === 0 ? (
              <p className="text-center py-12 text-muted-foreground">{t.tasks.noSearchResults}</p>
            ) : (
              <div className="space-y-2">
                {flatPending.map((task) => (
                  <TaskItem key={task.id} task={task} />
                ))}
              </div>
            )
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

        <TabsContent value="done" className="space-y-2 mt-4">
          {done.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">{t.tasks.noCompleted}</div>
          ) : doneFiltered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">{t.tasks.noCompleted}</div>
          ) : (
            doneFiltered.map((task) => <TaskItem key={task.id} task={task} />)
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
