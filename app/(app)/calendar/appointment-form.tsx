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
import { useLanguage } from "@/components/providers/language-provider";

export function AppointmentForm() {
  const [isPending, startTransition] = useTransition();
  const [allDay, setAllDay] = useState(false);
  const { t } = useLanguage();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set("all_day", String(allDay));
    startTransition(async () => {
      try {
        await addAppointment(formData);
        toast.success(t.calendar.added);
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
        <Label htmlFor="title">{t.calendar.titleField}</Label>
        <Input id="title" name="title" placeholder={t.calendar.appointmentPlaceholder} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="date">{t.calendar.date}</Label>
        <Input id="date" name="date" type="date" defaultValue={format(new Date(), "yyyy-MM-dd")} required />
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id="all_day" checked={allDay} onCheckedChange={(v) => setAllDay(!!v)} />
        <Label htmlFor="all_day" className="cursor-pointer">{t.calendar.allDay}</Label>
      </div>
      {!allDay && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="time">{t.calendar.startTime}</Label>
            <Input id="time" name="time" type="time" defaultValue="09:00" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="end_time">{t.calendar.endTime}</Label>
            <Input id="end_time" name="end_time" type="time" defaultValue="10:00" />
          </div>
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="location">{t.calendar.location}</Label>
        <Input id="location" name="location" placeholder={t.calendar.locationPlaceholder} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">{t.calendar.notes}</Label>
        <Textarea id="description" name="description" placeholder={t.calendar.notesPlaceholder} rows={2} className="resize-none" />
      </div>
      <Button type="submit" disabled={isPending} className="w-full bg-rose-500 hover:bg-rose-600 text-white">
        {isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
        {t.calendar.addAppointment}
      </Button>
    </form>
  );
}
