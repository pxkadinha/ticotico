"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Trash2, Loader2, Clock, RefreshCw, Pencil } from "lucide-react";
import { toast } from "sonner";
import { updateTaskStatus, updateTask, deleteTask } from "./actions";
import type { Task } from "@/types";
import { useLanguage } from "@/components/providers/language-provider";

const PRIORITY_COLORS: Record<string, { class: string; dot: string }> = {
  high: { class: "bg-red-500/10 text-red-600 border-0", dot: "bg-red-400" },
  medium: { class: "bg-amber-500/10 text-amber-600 border-0", dot: "bg-amber-400" },
  low: { class: "bg-muted text-muted-foreground border-0", dot: "bg-muted-foreground" },
};

function EditTaskDialog({
  task,
  open,
  onOpenChange,
}: {
  task: Task;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const { t } = useLanguage();
  const [isPending, startTransition] = useTransition();
  const [priority, setPriority] = useState(task.priority);
  const [recurrence, setRecurrence] = useState(task.recurrence ?? "none");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set("priority", priority);
    formData.set("recurrence", recurrence);

    startTransition(async () => {
      try {
        await updateTask(task.id, formData);
        toast.success(t.tasks.updated);
        onOpenChange(false);
      } catch {
        toast.error(t.tasks.couldNotUpdate);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{t.tasks.editTask}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-title">{t.tasks.taskTitle}</Label>
            <Input id="edit-title" name="title" defaultValue={task.title} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-desc">{t.tasks.details}</Label>
            <Textarea
              id="edit-desc"
              name="description"
              defaultValue={task.description ?? ""}
              placeholder={t.tasks.extraDetails}
              rows={2}
              className="resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>{t.tasks.priority}</Label>
              <Select value={priority} onValueChange={(v) => v && setPriority(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">{t.tasks.high}</SelectItem>
                  <SelectItem value="medium">{t.tasks.medium}</SelectItem>
                  <SelectItem value="low">{t.tasks.low}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t.tasks.repeat}</Label>
              <Select value={recurrence} onValueChange={(v) => v && setRecurrence(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t.tasks.noRepeat}</SelectItem>
                  <SelectItem value="daily">{t.tasks.daily}</SelectItem>
                  <SelectItem value="weekly">{t.tasks.weekly}</SelectItem>
                  <SelectItem value="monthly">{t.tasks.monthly}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-due">{t.tasks.dueDate}</Label>
            <Input
              id="edit-due"
              name="due_date"
              type="date"
              defaultValue={task.due_date ? format(new Date(task.due_date), "yyyy-MM-dd") : ""}
            />
          </div>
          <Button type="submit" disabled={isPending} className="w-full bg-rose-500 hover:bg-rose-600 text-white">
            {isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            {t.tasks.saveChanges}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function TaskItem({ task }: { task: Task }) {
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
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
    <>
      <div className={`flex items-start gap-3 p-4 rounded-xl border transition-all group ${
        isDone
          ? "bg-muted/30 border-border opacity-60"
          : "bg-card border-border hover:border-border/80 shadow-sm"
      }`}>
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

        <div className="flex items-center gap-0.5 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setEditing(true)}
            disabled={isPending}
            className="w-7 h-7 text-muted-foreground/50 hover:text-purple-400 hover:bg-purple-500/10"
          >
            <Pencil className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            disabled={isPending}
            className="w-7 h-7 text-muted-foreground/50 hover:text-red-400 hover:bg-red-500/10"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>

      <EditTaskDialog task={task} open={editing} onOpenChange={setEditing} />
    </>
  );
}
