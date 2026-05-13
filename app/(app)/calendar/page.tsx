import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isToday, isTomorrow, addDays } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, MapPin, Clock } from "lucide-react";
import { AppointmentForm } from "./appointment-form";
import { DeleteAppointmentButton } from "./delete-button";
import type { Appointment } from "@/types";
import { getT } from "@/lib/i18n/server";

function formatTime(dateStr: string) {
  return format(new Date(dateStr), "HH:mm");
}

export default async function CalendarPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: member } = await supabase
    .from("family_members").select("family_id").eq("user_id", user.id).single();
  if (!member) redirect("/dashboard");

  const t = await getT();
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calDays = eachDayOfInterval({ start: calStart, end: calEnd });

  const { data: appointments } = await supabase
    .from("appointments").select("*").eq("family_id", member.family_id)
    .gte("start_time", calStart.toISOString())
    .lte("start_time", endOfMonth(addDays(now, 60)).toISOString())
    .order("start_time", { ascending: true });

  const allAppts = (appointments ?? []) as Appointment[];
  const upcoming = allAppts.filter((a) => new Date(a.start_time) >= new Date());

  function getApptForDay(day: Date) {
    return allAppts.filter((a) => isSameDay(new Date(a.start_time), day));
  }

  function getEventLabel(dateStr: string) {
    const d = new Date(dateStr);
    if (isToday(d)) return t.calendar.today;
    if (isTomorrow(d)) return t.calendar.tomorrow;
    return format(d, "EEE, d MMM");
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t.calendar.title}</h1>
        <p className="text-muted-foreground mt-1">{format(now, "MMMM yyyy")}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <Card className="border-0 shadow-sm">
            <CardHeader><CardTitle className="text-base">{t.calendar.newAppointment}</CardTitle></CardHeader>
            <CardContent><AppointmentForm /></CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader><CardTitle className="text-base">{t.calendar.upcoming}</CardTitle></CardHeader>
            <CardContent className="space-y-3 p-0">
              {upcoming.length === 0 ? (
                <p className="text-sm text-muted-foreground px-6 pb-4">{t.calendar.noUpcoming}</p>
              ) : (
                upcoming.slice(0, 6).map((appt) => (
                  <div key={appt.id} className="flex items-start gap-3 px-6 py-3 border-b border-border last:border-0 group">
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
                            {formatTime(appt.start_time)}{appt.end_time && ` – ${formatTime(appt.end_time)}`}
                          </span>
                        )}
                        {appt.all_day && (
                          <Badge variant="secondary" className="text-xs border-0 bg-purple-500/10 text-purple-500 px-1.5 py-0">
                            {t.calendar.allDay}
                          </Badge>
                        )}
                      </div>
                      {appt.location && (
                        <p className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                          <MapPin className="w-3 h-3" />{appt.location}
                        </p>
                      )}
                    </div>
                    <DeleteAppointmentButton id={appt.id} />
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="grid grid-cols-7 mb-2">
                {t.calendar.weekdays.map((d) => (
                  <div key={d} className="text-xs font-semibold text-muted-foreground text-center py-1">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-0.5">
                {calDays.map((day) => {
                  const dayAppts = getApptForDay(day);
                  const isCurrentMonth = day.getMonth() === now.getMonth();
                  const todayDay = isToday(day);
                  return (
                    <div
                      key={day.toISOString()}
                      className={`min-h-[60px] p-1 rounded-lg ${!isCurrentMonth ? "opacity-30" : ""} ${todayDay ? "bg-rose-500/10 ring-1 ring-rose-500/30" : ""}`}
                    >
                      <p className={`text-xs font-medium mb-1 text-center w-6 h-6 rounded-full flex items-center justify-center mx-auto ${todayDay ? "bg-rose-500 text-white" : "text-muted-foreground"}`}>
                        {format(day, "d")}
                      </p>
                      <div className="space-y-0.5">
                        {dayAppts.slice(0, 2).map((appt) => (
                          <div key={appt.id} className="text-xs bg-purple-500/10 text-purple-500 rounded px-1 truncate leading-5" title={appt.title}>
                            {appt.title}
                          </div>
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
    </div>
  );
}
