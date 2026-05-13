import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign,
  CheckSquare,
  CalendarDays,
  Baby,
  ShoppingCart,
  FileText,
  TrendingDown,
  TrendingUp,
  Clock,
  AlertCircle,
} from "lucide-react";
import { format, isToday, isTomorrow, startOfMonth, endOfMonth } from "date-fns";

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
  };
}

function formatAppointmentDate(dateStr: string) {
  const d = new Date(dateStr);
  if (isToday(d)) return `Today ${format(d, "HH:mm")}`;
  if (isTomorrow(d)) return `Tomorrow ${format(d, "HH:mm")}`;
  return format(d, "MMM d, HH:mm");
}

function formatBabyLogType(type: string) {
  const labels: Record<string, string> = {
    feed: "Feed",
    sleep: "Sleep",
    diaper: "Diaper change",
    milestone: "Milestone",
  };
  return labels[type] ?? type;
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
    return (
      <div className="text-center py-20 text-muted-foreground">
        <p>No family found. Please register to create one.</p>
      </div>
    );
  }

  const data = await getDashboardData(member.family_id);
  const firstName = member.display_name?.split(" ")[0] ?? "there";

  return (
    <div className="max-w-6xl mx-auto space-y-8 pt-4 md:pt-6">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Good {getGreeting()}, {firstName} 👋
        </h1>
        <p className="text-muted-foreground mt-1">
          {format(new Date(), "EEEE, MMMM d")} — here&apos;s your family overview
        </p>
      </div>

      {/* Top stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Monthly income"
          value={`€${data.totalIncome.toFixed(2)}`}
          icon={TrendingUp}
          iconClass="text-emerald-500"
          bgClass="bg-emerald-500/10"
          href="/expenses"
        />
        <StatCard
          title="Monthly expenses"
          value={`€${data.totalExpenses.toFixed(2)}`}
          icon={TrendingDown}
          iconClass="text-red-500"
          bgClass="bg-red-500/10"
          href="/expenses"
        />
        <StatCard
          title="Pending tasks"
          value={String(data.tasks.length)}
          icon={CheckSquare}
          iconClass="text-blue-500"
          bgClass="bg-blue-500/10"
          href="/tasks"
        />
        <StatCard
          title="Upcoming events"
          value={String(data.appointments.length)}
          icon={CalendarDays}
          iconClass="text-purple-500"
          bgClass="bg-purple-500/10"
          href="/calendar"
        />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Tasks */}
        <Link href="/tasks" className="group block">
          <Card className="border-0 shadow-sm group-hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-blue-500" />
                  Tasks
                </CardTitle>
                <span className="text-xs text-rose-500 group-hover:underline">View all</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {data.tasks.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">All done! 🎉</p>
              ) : (
                data.tasks.slice(0, 4).map((task) => (
                  <div
                    key={task.id}
                    className="flex items-start gap-2 py-1.5 border-b border-border last:border-0"
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${
                        task.priority === "high"
                          ? "bg-red-400"
                          : task.priority === "medium"
                          ? "bg-amber-400"
                          : "bg-muted-foreground"
                      }`}
                    />
                    <div className="min-w-0">
                      <p className="text-sm text-foreground truncate">{task.title}</p>
                      {task.due_date && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" />
                          {format(new Date(task.due_date), "MMM d")}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </Link>

        {/* Appointments */}
        <Link href="/calendar" className="group block">
          <Card className="border-0 shadow-sm group-hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-purple-500" />
                  Upcoming
                </CardTitle>
                <span className="text-xs text-rose-500 group-hover:underline">View all</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {data.appointments.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">No upcoming events</p>
              ) : (
                data.appointments.slice(0, 4).map((appt) => (
                  <div
                    key={appt.id}
                    className="flex items-start gap-3 py-1.5 border-b border-border last:border-0"
                  >
                    <div className="w-8 h-8 bg-purple-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <CalendarDays className="w-4 h-4 text-purple-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-foreground truncate font-medium">
                        {appt.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatAppointmentDate(appt.start_time)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </Link>

        {/* Baby logs */}
        <Link href="/baby" className="group block">
          <Card className="border-0 shadow-sm group-hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Baby className="w-4 h-4 text-pink-500" />
                  Baby
                </CardTitle>
                <span className="text-xs text-rose-500 group-hover:underline">View all</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {data.babyLogs.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">No logs yet</p>
              ) : (
                data.babyLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center gap-3 py-1.5 border-b border-border last:border-0"
                  >
                    <Badge
                      variant="secondary"
                      className="text-xs capitalize bg-pink-500/10 text-pink-500 border-0"
                    >
                      {formatBabyLogType(log.type)}
                    </Badge>
                    <p className="text-xs text-muted-foreground ml-auto">
                      {format(new Date(log.timestamp), "HH:mm")}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </Link>

        {/* Shopping lists */}
        <Link href="/shopping" className="group block">
          <Card className="border-0 shadow-sm group-hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-orange-500" />
                  Shopping
                </CardTitle>
                <span className="text-xs text-rose-500 group-hover:underline">View all</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {data.shoppingLists.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">No lists yet</p>
              ) : (
                data.shoppingLists.map((list) => {
                  const items = (list.shopping_items as { checked: boolean }[]) ?? [];
                  const done = items.filter((i) => i.checked).length;
                  const total = items.length;
                  return (
                    <div
                      key={list.id}
                      className="flex items-center justify-between py-1.5 border-b border-border last:border-0"
                    >
                      <p className="text-sm text-foreground">{list.title}</p>
                      <span className="text-xs text-muted-foreground">
                        {done}/{total}
                      </span>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </Link>

        {/* Notes */}
        <Link href="/notes" className="group block">
          <Card className="border-0 shadow-sm group-hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <FileText className="w-4 h-4 text-teal-500" />
                  Notes
                </CardTitle>
                <span className="text-xs text-rose-500 group-hover:underline">View all</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {data.notes.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">No notes yet</p>
              ) : (
                data.notes.map((note) => (
                  <div
                    key={note.id}
                    className="py-1.5 border-b border-border last:border-0"
                  >
                    <p className="text-sm text-foreground font-medium truncate">
                      {note.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {format(new Date(note.updated_at), "MMM d")}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </Link>

        {/* Balance */}
        <Link href="/expenses" className="group block">
          <Card className="border-0 shadow-sm group-hover:shadow-md transition-shadow cursor-pointer h-full bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <DollarSign
                  className={`w-4 h-4 ${
                    data.balance >= 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-red-500 dark:text-red-400"
                  }`}
                />
                Monthly balance
              </CardTitle>
              <CardDescription>This month so far</CardDescription>
            </CardHeader>
            <CardContent>
              <p
                className={`text-3xl font-bold ${
                  data.balance >= 0 ? "text-emerald-500" : "text-red-500"
                }`}
              >
                {data.balance >= 0 ? "+" : ""}€{data.balance.toFixed(2)}
              </p>
              {data.balance < 0 && (
                <div className="flex items-center gap-1 mt-2 text-red-500 text-xs">
                  <AlertCircle className="w-3 h-3" />
                  Expenses exceed income this month
                </div>
              )}
              <span className="text-xs text-rose-500 group-hover:underline mt-3 inline-block">
                View details →
              </span>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  return "evening";
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
