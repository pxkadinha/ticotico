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
import { addAppointment, updateAppointment } from "./actions";
import { useLanguage } from "@/components/providers/language-provider";
import type { Appointment } from "@/types";

interface AppointmentFormProps {
  appointment?: Appointment;
  onSuccess?: () => void;
}

export function AppointmentForm({ appointment, onSuccess }: AppointmentFormProps) {
  const [isPending, startTransition] = useTransition();
  const [allDay, setAllDay] = useState(appointment?.all_day ?? false);
  const { t } = useLanguage();

  const isEditing = !!appointment;

  function getDefaultDate() {
    if (appointment) return format(new Date(appointment.start_time), "yyyy-MM-dd");
    return format(new Date(), "yyyy-MM-dd");
  }

  function getDefaultTime(field: "start" | "end") {
    if (field === "start" && appointment && !appointment.all_day) {
      return format(new Date(appointment.start_time), "HH:mm");
    }
    if (field === "end" && appointment?.end_time) {
      return format(new Date(appointment.end_time), "HH:mm");
    }
    return field === "start" ? "09:00" : "10:00";
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set("all_day", String(allDay));

    startTransition(async () => {
      try {
        if (isEditing) {
          await updateAppointment(appointment.id, formData);
          toast.success(t.calendar.updated);
        } else {
          await addAppointment(formData);
          toast.success(t.calendar.added);
          (e.target as HTMLFormElement).reset();
          setAllDay(false);
        }
        onSuccess?.();
      } catch (err) {
        toast.error((err as Error).message);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor={`title-${isEditing ? appointment?.id : "new"}`}>{t.calendar.titleField}</Label>
        <Input
          id={`title-${isEditing ? appointment?.id : "new"}`}
          name="title"
          placeholder={t.calendar.appointmentPlaceholder}
          defaultValue={appointment?.title ?? ""}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`date-${isEditing ? appointment?.id : "new"}`}>{t.calendar.date}</Label>
        <Input
          id={`date-${isEditing ? appointment?.id : "new"}`}
          name="date"
          type="date"
          defaultValue={getDefaultDate()}
          required
        />
      </div>
      <div className="flex items-center gap-2">
        <Checkbox
          id={`all_day-${isEditing ? appointment?.id : "new"}`}
          checked={allDay}
          onCheckedChange={(v) => setAllDay(!!v)}
        />
        <Label htmlFor={`all_day-${isEditing ? appointment?.id : "new"}`} className="cursor-pointer">
          {t.calendar.allDay}
        </Label>
      </div>
      {!allDay && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor={`time-${isEditing ? appointment?.id : "new"}`}>{t.calendar.startTime}</Label>
            <Input
              id={`time-${isEditing ? appointment?.id : "new"}`}
              name="time"
              type="time"
              defaultValue={getDefaultTime("start")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`end_time-${isEditing ? appointment?.id : "new"}`}>{t.calendar.endTime}</Label>
            <Input
              id={`end_time-${isEditing ? appointment?.id : "new"}`}
              name="end_time"
              type="time"
              defaultValue={getDefaultTime("end")}
            />
          </div>
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor={`location-${isEditing ? appointment?.id : "new"}`}>{t.calendar.location}</Label>
        <Input
          id={`location-${isEditing ? appointment?.id : "new"}`}
          name="location"
          placeholder={t.calendar.locationPlaceholder}
          defaultValue={appointment?.location ?? ""}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`description-${isEditing ? appointment?.id : "new"}`}>{t.calendar.notes}</Label>
        <Textarea
          id={`description-${isEditing ? appointment?.id : "new"}`}
          name="description"
          placeholder={t.calendar.notesPlaceholder}
          rows={2}
          className="resize-none"
          defaultValue={appointment?.description ?? ""}
        />
      </div>
      <Button
        type="submit"
        disabled={isPending}
        className="w-full bg-rose-500 hover:bg-rose-600 text-white"
      >
        {isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
        {isEditing ? t.calendar.saveChanges : t.calendar.addAppointment}
      </Button>
    </form>
  );
}
