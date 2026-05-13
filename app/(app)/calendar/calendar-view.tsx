"use client";

import { useState } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  isToday,
  isTomorrow,
  addMonths,
  subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight, CalendarDays, Clock, MapPin, Pencil } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AppointmentForm } from "./appointment-form";
import { DeleteAppointmentButton } from "./delete-button";
import { useLanguage } from "@/components/providers/language-provider";
import type { Appointment } from "@/types";

interface CalendarViewProps {
  appointments: Appointment[];
}

function formatTime(dateStr: string) {
  return format(new Date(dateStr), "HH:mm");
}

export function CalendarView({ appointments }: CalendarViewProps) {
  const { t } = useLanguage();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [editingAppt, setEditingAppt] = useState<Appointment | null>(null);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calDays = eachDayOfInterval({ start: calStart, end: calEnd });

  const upcoming = [...appointments]
    .filter((a) => new Date(a.start_time) >= new Date())
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

  function getApptForDay(day: Date) {
    return appointments.filter((a) => isSameDay(new Date(a.start_time), day));
  }

  function getEventLabel(dateStr: string) {
    const d = new Date(dateStr);
    if (isToday(d)) return t.calendar.today;
    if (isTomorrow(d)) return t.calendar.tomorrow;
    return format(d, "EEE, d MMM");
  }

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left sidebar: new appointment form + upcoming */}
        <div className="space-y-4">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">{t.calendar.newAppointment}</CardTitle>
            </CardHeader>
            <CardContent>
              <AppointmentForm />
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">{t.calendar.upcoming}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-0">
              {upcoming.length === 0 ? (
                <p className="text-sm text-muted-foreground px-6 pb-4">{t.calendar.noUpcoming}</p>
              ) : (
                upcoming.slice(0, 6).map((appt) => (
                  <div
                    key={appt.id}
                    className="flex items-start gap-3 px-6 py-3 border-b border-border last:border-0 group"
                  >
                    <div className="w-9 h-9 bg-purple-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                      <CalendarDays className="w-4 h-4 text-purple-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{appt.title}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-xs text-muted-foreground">{getEventLabel(appt.start_time)}</span>
                        {!appt.all_day && (
                          <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {formatTime(appt.start_time)}
                            {appt.end_time && ` – ${formatTime(appt.end_time)}`}
                          </span>
                        )}
                        {appt.all_day && (
                          <Badge
                            variant="secondary"
                            className="text-xs border-0 bg-purple-500/10 text-purple-500 px-1.5 py-0"
                          >
                            {t.calendar.allDay}
                          </Badge>
                        )}
                      </div>
                      {appt.location && (
                        <p className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                          <MapPin className="w-3 h-3" />
                          {appt.location}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-7 h-7 text-muted-foreground/30 hover:text-purple-400 hover:bg-purple-500/10 flex-shrink-0"
                        onClick={() => setEditingAppt(appt)}
                      >
                        <Pencil className="w-3 h-3" />
                      </Button>
                      <DeleteAppointmentButton id={appt.id} />
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Calendar grid */}
        <div className="lg:col-span-2">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              {/* Month navigation */}
              <div className="flex items-center justify-between mb-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  aria-label="Previous month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <h2 className="text-sm font-semibold text-foreground">
                  {format(currentMonth, "MMMM yyyy")}
                </h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  aria-label="Next month"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>

              {/* Weekday headers */}
              <div className="grid grid-cols-7 mb-2">
                {t.calendar.weekdays.map((d) => (
                  <div key={d} className="text-xs font-semibold text-muted-foreground text-center py-1">
                    {d}
                  </div>
                ))}
              </div>

              {/* Day grid */}
              <div className="grid grid-cols-7 gap-0.5">
                {calDays.map((day) => {
                  const dayAppts = getApptForDay(day);
                  const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
                  const todayDay = isToday(day);
                  return (
                    <div
                      key={day.toISOString()}
                      className={`min-h-[60px] p-1 rounded-lg ${!isCurrentMonth ? "opacity-30" : ""} ${todayDay ? "bg-rose-500/10 ring-1 ring-rose-500/30" : ""}`}
                    >
                      <p
                        className={`text-xs font-medium mb-1 text-center w-6 h-6 rounded-full flex items-center justify-center mx-auto ${
                          todayDay ? "bg-rose-500 text-white" : "text-muted-foreground"
                        }`}
                      >
                        {format(day, "d")}
                      </p>
                      <div className="space-y-0.5">
                        {dayAppts.slice(0, 2).map((appt) => (
                          <button
                            key={appt.id}
                            type="button"
                            onClick={() => setEditingAppt(appt)}
                            className="w-full text-left text-xs bg-purple-500/10 text-purple-500 rounded px-1 truncate leading-5 hover:bg-purple-500/20 transition-colors"
                            title={appt.title}
                          >
                            {appt.title}
                          </button>
                        ))}
                        {dayAppts.length > 2 && (
                          <p className="text-xs text-muted-foreground px-1">+{dayAppts.length - 2}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit dialog */}
      <Dialog open={!!editingAppt} onOpenChange={(open) => !open && setEditingAppt(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t.calendar.editAppointment}</DialogTitle>
          </DialogHeader>
          {editingAppt && (
            <AppointmentForm
              appointment={editingAppt}
              onSuccess={() => setEditingAppt(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
