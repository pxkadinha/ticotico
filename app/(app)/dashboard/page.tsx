import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  DollarSign,
  CheckSquare,
  CalendarDays,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { DashboardChatWidget } from "./chat-widget";
import { DashboardGrid } from "./dashboard-grid";
import { getT } from "@/lib/i18n/server";
import { getLocale } from "@/lib/i18n/server";
import { getDateFnsLocale } from "@/lib/i18n/date-locale";
import type { Message } from "@/types";

async function getDashboardData(familyId: string) {
  const supabase = await createClient();
  const now = new Date();
  const monthStart = startOfMonth(now).toISOString().split("T")[0];
  const monthEnd = endOfMonth(now).toISOString().split("T")[0];

  const [
    { data: expenses },
    { data: tasks },
    { data: appointments },
    { data: babyLogs },
    { data: shoppingLists },
    { data: notes },
    { data: messages },
  ] = await Promise.all([
    supabase
      .from("expenses")
      .select("*")
      .eq("family_id", familyId)
      .gte("date", monthStart)
      .lte("date", monthEnd),
    supabase
      .from("tasks")
      .select("*")
      .eq("family_id", familyId)
      .neq("status", "done")
      .order("due_date", { ascending: true })
      .limit(5),
    supabase
      .from("appointments")
      .select("*")
      .eq("family_id", familyId)
      .gte("start_time", now.toISOString())
      .order("start_time", { ascending: true })
      .limit(5),
    supabase
      .from("baby_logs")
      .select("*")
      .eq("family_id", familyId)
      .order("timestamp", { ascending: false })
      .limit(3),
    supabase
      .from("shopping_lists")
      .select("*, shopping_items(id, checked)")
      .eq("family_id", familyId)
      .limit(3),
    supabase
      .from("notes")
      .select("*")
      .eq("family_id", familyId)
      .order("updated_at", { ascending: false })
      .limit(3),
    supabase
      .from("messages")
      .select("*")
      .eq("family_id", familyId)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const totalIncome =
    expenses
      ?.filter((e) => e.type === "income")
      .reduce((sum, e) => sum + Number(e.amount), 0) ?? 0;
  const totalExpenses =
    expenses
      ?.filter((e) => e.type === "expense")
      .reduce((sum, e) => sum + Number(e.amount), 0) ?? 0;

  return {
    totalIncome,
    totalExpenses,
    balance: totalIncome - totalExpenses,
    tasks: tasks ?? [],
    appointments: appointments ?? [],
    babyLogs: babyLogs ?? [],
    shoppingLists: shoppingLists ?? [],
    notes: notes ?? [],
    // Reverse so oldest-first for display
    messages: ((messages ?? []) as Message[]).reverse(),
  };
}


export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: member } = await supabase
    .from("family_members")
    .select("family_id, display_name")
    .eq("user_id", user.id)
    .single();

  if (!member?.family_id) {
    const t = await getT();
    return (
      <div className="text-center py-20 text-muted-foreground">
        <p>{t.dashboard.noFamily}</p>
      </div>
    );
  }

  const [data, t, locale] = await Promise.all([
    getDashboardData(member.family_id),
    getT(),
    getLocale(),
  ]);
  const firstName = member.display_name?.split(" ")[0] ?? "there";
  const dateFnsLocale = getDateFnsLocale(locale);
  const datePattern = locale === "pt" ? "EEEE, d 'de' MMMM" : "EEEE, d MMMM";
  const formattedDate = format(new Date(), datePattern, { locale: dateFnsLocale });

  return (
    <div className="max-w-6xl mx-auto space-y-8 pt-4 md:pt-6">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {getGreeting(t)}, {firstName} 👋
        </h1>
        <p className="text-muted-foreground mt-1">
          {formattedDate} — {t.dashboard.subtitle}
        </p>
      </div>

      {/* Top stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title={t.dashboard.monthlyIncome}
          value={`€${data.totalIncome.toFixed(2)}`}
          icon={TrendingUp}
          iconClass="text-emerald-500"
          bgClass="bg-emerald-500/10"
          href="/expenses"
        />
        <StatCard
          title={t.dashboard.monthlyExpenses}
          value={`€${data.totalExpenses.toFixed(2)}`}
          icon={TrendingDown}
          iconClass="text-red-500"
          bgClass="bg-red-500/10"
          href="/expenses"
        />
        <StatCard
          title={t.dashboard.pendingTasks}
          value={String(data.tasks.length)}
          icon={CheckSquare}
          iconClass="text-blue-500"
          bgClass="bg-blue-500/10"
          href="/tasks"
        />
        <StatCard
          title={t.dashboard.upcomingEvents}
          value={String(data.appointments.length)}
          icon={CalendarDays}
          iconClass="text-purple-500"
          bgClass="bg-purple-500/10"
          href="/calendar"
        />
      </div>

      {/* Main grid — drag to reorder */}
      <DashboardGrid
        familyId={member.family_id}
        tasks={data.tasks}
        appointments={data.appointments}
        babyLogs={data.babyLogs}
        shoppingLists={data.shoppingLists as Parameters<typeof DashboardGrid>[0]["shoppingLists"]}
        notes={data.notes}
        totalIncome={data.totalIncome}
        totalExpenses={data.totalExpenses}
        balance={data.balance}
      />

      {/* Chat widget */}
      <DashboardChatWidget
        initialMessages={data.messages}
        familyId={member.family_id}
        currentUserId={user.id}
      />
    </div>
  );
}

function getGreeting(t: Awaited<ReturnType<typeof getT>>) {
  const hour = new Date().getHours();
  if (hour < 12) return t.dashboard.greetings.morning;
  if (hour < 20) return t.dashboard.greetings.afternoon;
  return t.dashboard.greetings.evening;
}

function StatCard({
  title,
  value,
  icon: Icon,
  iconClass,
  bgClass,
  href,
}: {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  iconClass: string;
  bgClass: string;
  href: string;
}) {
  return (
    <Link href={href} className="group block">
      <Card className="border-0 shadow-sm group-hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="p-4">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${bgClass}`}>
            <Icon className={`w-5 h-5 ${iconClass}`} />
          </div>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{title}</p>
        </CardContent>
      </Card>
    </Link>
  );
}
