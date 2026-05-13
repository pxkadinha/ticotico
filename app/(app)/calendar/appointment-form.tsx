"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { addAppointment } from "./actions";

export function AppointmentForm() {
  const [isPending, startTransition] = useTransition();
  const [allDay, setAllDay] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set("all_day", String(allDay));

    startTransition(async () => {
      try {
        await addAppointment(formData);
        toast.success("Appointment added");
        (e.target as HTMLFormElement).reset();
        setAllDay(false);
      } catch (err) {
        toast.error((err as Error).message);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          name="title"
          placeholder="Doctor appointment, etc."
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="date">Date</Label>
        <Input
          id="date"
          name="date"
          type="date"
          defaultValue={format(new Date(), "yyyy-MM-dd")}
          required
        />
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id="all_day"
          checked={allDay}
          onCheckedChange={(v) => setAllDay(!!v)}
        />
        <Label htmlFor="all_day" className="cursor-pointer">
          All day
        </Label>
      </div>

      {!allDay && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="time">Start time</Label>
            <Input id="time" name="time" type="time" defaultValue="09:00" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="end_time">End time</Label>
            <Input id="end_time" name="end_time" type="time" defaultValue="10:00" />
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="location">Location (optional)</Label>
        <Input id="location" name="location" placeholder="Hospital, home, etc." />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Notes (optional)</Label>
        <Textarea
          id="description"
          name="description"
          placeholder="Any extra notes..."
          rows={2}
          className="resize-none"
        />
      </div>

      <Button
        type="submit"
        disabled={isPending}
        className="w-full bg-rose-500 hover:bg-rose-600 text-white"
      >
        {isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
        Add appointment
      </Button>
    </form>
  );
}
