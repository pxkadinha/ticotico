import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { subMonths, addMonths, startOfMonth, endOfMonth } from "date-fns";
import { CalendarView } from "./calendar-view";
import { getT } from "@/lib/i18n/server";
import type { Appointment } from "@/types";

export default async function CalendarPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: member } = await supabase
    .from("family_members")
    .select("family_id")
    .eq("user_id", user.id)
    .single();
  if (!member) redirect("/dashboard");

  const t = await getT();

  // Fetch appointments spanning 6 months back and 6 months forward
  // so the client can navigate months without refetching
  const now = new Date();
  const rangeStart = startOfMonth(subMonths(now, 3));
  const rangeEnd = endOfMonth(addMonths(now, 6));

  const { data: appointments } = await supabase
    .from("appointments")
    .select("*")
    .eq("family_id", member.family_id)
    .gte("start_time", rangeStart.toISOString())
    .lte("start_time", rangeEnd.toISOString())
    .order("start_time", { ascending: true });

  const allAppts = (appointments ?? []) as Appointment[];

  return (
    <div className="max-w-6xl mx-auto space-y-8 pt-4 md:pt-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t.calendar.title}</h1>
        <p className="text-muted-foreground mt-1">{t.calendar.subtitle}</p>
      </div>

      <CalendarView appointments={allAppts} />
    </div>
  );
}
