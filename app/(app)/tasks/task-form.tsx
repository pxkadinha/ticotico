"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
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
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { addTask } from "./actions";

export function TaskForm() {
  const [isPending, startTransition] = useTransition();
  const [priority, setPriority] = useState("medium");
  const [recurrence, setRecurrence] = useState("none");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set("priority", priority);
    formData.set("recurrence", recurrence);

    startTransition(async () => {
      try {
        await addTask(formData);
        toast.success("Task added");
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
        <Label htmlFor="title">Task title</Label>
        <Input id="title" name="title" placeholder="What needs doing?" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Details (optional)</Label>
        <Textarea
          id="description"
          name="description"
          placeholder="Any extra details..."
          rows={2}
          className="resize-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Priority</Label>
          <Select value={priority} onValueChange={(v) => v && setPriority(v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Repeat</Label>
          <Select value={recurrence} onValueChange={(v) => v && setRecurrence(v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No repeat</SelectItem>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="due_date">Due date (optional)</Label>
        <Input id="due_date" name="due_date" type="date" />
      </div>

      <Button
        type="submit"
        disabled={isPending}
        className="w-full bg-rose-500 hover:bg-rose-600 text-white"
      >
        {isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
        Add task
      </Button>
    </form>
  );
}
