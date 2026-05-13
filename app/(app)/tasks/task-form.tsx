"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { addTask } from "./actions";
import { useLanguage } from "@/components/providers/language-provider";

export function TaskForm() {
  const [isPending, startTransition] = useTransition();
  const [priority, setPriority] = useState("medium");
  const [recurrence, setRecurrence] = useState("none");
  const { t } = useLanguage();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set("priority", priority);
    formData.set("recurrence", recurrence);

    startTransition(async () => {
      try {
        await addTask(formData);
        toast.success(t.tasks.added);
        (e.target as HTMLFormElement).reset();
        setPriority("medium");
        setRecurrence("none");
      } catch (err) {
        toast.error((err as Error).message);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">{t.tasks.taskTitle}</Label>
        <Input id="title" name="title" placeholder={t.tasks.whatToDo} required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">{t.tasks.details}</Label>
        <Textarea id="description" name="description" placeholder={t.tasks.extraDetails} rows={2} className="resize-none" />
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
        <Label htmlFor="due_date">{t.tasks.dueDate}</Label>
        <Input id="due_date" name="due_date" type="date" />
      </div>

      <Button type="submit" disabled={isPending} className="w-full bg-rose-500 hover:bg-rose-600 text-white">
        {isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
        {t.tasks.addTask}
      </Button>
    </form>
  );
}
