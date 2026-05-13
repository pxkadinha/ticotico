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

const PRIORITY_CONFIG: Record<
  string,
  { label: string; class: string; dot: string }
> = {
  high: {
    label: "High",
    class: "bg-red-50 text-red-700 border-0",
    dot: "bg-red-400",
  },
  medium: {
    label: "Medium",
    class: "bg-amber-50 text-amber-700 border-0",
    dot: "bg-amber-400",
  },
  low: {
    label: "Low",
    class: "bg-gray-50 text-gray-600 border-0",
    dot: "bg-gray-300",
  },
};

const RECURRENCE_LABEL: Record<string, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
};

export function TaskItem({ task }: { task: Task }) {
  const [isPending, startTransition] = useTransition();
  const isDone = task.status === "done";
  const priority = PRIORITY_CONFIG[task.priority] ?? PRIORITY_CONFIG.medium;

  function toggleStatus() {
    const newStatus = isDone ? "pending" : "done";
    startTransition(async () => {
      try {
        await updateTaskStatus(task.id, newStatus);
      } catch {
        toast.error("Could not update task");
      }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      try {
        await deleteTask(task.id);
        toast.success("Task deleted");
      } catch {
        toast.error("Could not delete task");
      }
    });
  }

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-xl border transition-all group ${
        isDone
          ? "bg-gray-50 border-gray-100 opacity-60"
          : "bg-white border-gray-100 hover:border-gray-200 shadow-sm"
      }`}
    >
      <div className="mt-0.5">
        {isPending ? (
          <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
        ) : (
          <Checkbox
            checked={isDone}
            onCheckedChange={toggleStatus}
            className="border-gray-300 data-[state=checked]:bg-rose-500 data-[state=checked]:border-rose-500"
          />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-medium ${isDone ? "line-through text-gray-400" : "text-gray-800"}`}
        >
          {task.title}
        </p>
        {task.description && (
          <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">
            {task.description}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-2 mt-2">
          <Badge variant="secondary" className={`text-xs ${priority.class}`}>
            {priority.label}
          </Badge>
          {task.due_date && (
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <Clock className="w-3 h-3" />
              {format(new Date(task.due_date), "MMM d")}
            </span>
          )}
          {task.recurrence !== "none" && (
            <span className="flex items-center gap-1 text-xs text-blue-500">
              <RefreshCw className="w-3 h-3" />
              {RECURRENCE_LABEL[task.recurrence]}
            </span>
          )}
        </div>
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={handleDelete}
        disabled={isPending}
        className="w-7 h-7 text-gray-300 hover:text-red-400 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
      >
        <Trash2 className="w-3 h-3" />
      </Button>
    </div>
  );
}
