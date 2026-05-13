"use client";

import { useTransition } from "react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, Loader2, Clock, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { updateTaskStatus, deleteTask } from "./actions";
import type { Task } from "@/types";
import { useLanguage } from "@/components/providers/language-provider";

const PRIORITY_COLORS: Record<string, { class: string; dot: string }> = {
  high: { class: "bg-red-500/10 text-red-600 border-0", dot: "bg-red-400" },
  medium: { class: "bg-amber-500/10 text-amber-600 border-0", dot: "bg-amber-400" },
  low: { class: "bg-muted text-muted-foreground border-0", dot: "bg-muted-foreground" },
};

export function TaskItem({ task }: { task: Task }) {
  const [isPending, startTransition] = useTransition();
  const isDone = task.status === "done";
  const priority = PRIORITY_COLORS[task.priority] ?? PRIORITY_COLORS.medium;
  const { t } = useLanguage();

  function toggleStatus() {
    const newStatus = isDone ? "pending" : "done";
    startTransition(async () => {
      try {
        await updateTaskStatus(task.id, newStatus);
      } catch {
        toast.error(t.tasks.couldNotUpdate);
      }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      try {
        await deleteTask(task.id);
        toast.success(t.tasks.deleted);
      } catch {
        toast.error(t.tasks.couldNotDelete);
      }
    });
  }

  const priorityLabel = t.tasks.priorityLabels[task.priority as keyof typeof t.tasks.priorityLabels];
  const recurrenceLabel = task.recurrence !== "none"
    ? t.tasks.recurrenceLabels[task.recurrence as keyof typeof t.tasks.recurrenceLabels]
    : null;

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-xl border transition-all group ${
        isDone
          ? "bg-muted/30 border-border opacity-60"
          : "bg-card border-border hover:border-border/80 shadow-sm"
      }`}
    >
      <div className="mt-0.5">
        {isPending ? (
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        ) : (
          <Checkbox
            checked={isDone}
            onCheckedChange={toggleStatus}
            className="border-border data-[state=checked]:bg-rose-500 data-[state=checked]:border-rose-500"
          />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${isDone ? "line-through text-muted-foreground" : "text-foreground"}`}>
          {task.title}
        </p>
        {task.description && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{task.description}</p>
        )}
        <div className="flex flex-wrap items-center gap-2 mt-2">
          <Badge variant="secondary" className={`text-xs ${priority.class}`}>
            {priorityLabel}
          </Badge>
          {task.due_date && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              {format(new Date(task.due_date), "d MMM")}
            </span>
          )}
          {recurrenceLabel && (
            <span className="flex items-center gap-1 text-xs text-blue-500">
              <RefreshCw className="w-3 h-3" />
              {recurrenceLabel}
            </span>
          )}
        </div>
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={handleDelete}
        disabled={isPending}
        className="w-7 h-7 text-muted-foreground/50 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
      >
        <Trash2 className="w-3 h-3" />
      </Button>
    </div>
  );
}
