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
      <div className="text-center py-20 text-gray-500">
        <p>No family found. Please register to create one.</p>
      </div>
    );
  }

  const data = await getDashboardData(member.family_id);
  const firstName = member.display_name?.split(" ")[0] ?? "there";

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Good {getGreeting()}, {firstName} 👋
        </h1>
        <p className="text-gray-500 mt-1">
          {format(new Date(), "EEEE, MMMM d")} — here&apos;s your family overview
        </p>
      </div>

      {/* Top stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Monthly income"
          value={`€${data.totalIncome.toFixed(2)}`}
          icon={TrendingUp}
          color="text-emerald-600"
          bg="bg-emerald-50"
          href="/expenses"
        />
        <StatCard
          title="Monthly expenses"
          value={`€${data.totalExpenses.toFixed(2)}`}
          icon={TrendingDown}
          color="text-red-500"
          bg="bg-red-50"
          href="/expenses"
        />
        <StatCard
          title="Pending tasks"
          value={String(data.tasks.length)}
          icon={CheckSquare}
          color="text-blue-600"
          bg="bg-blue-50"
          href="/tasks"
        />
        <StatCard
          title="Upcoming events"
          value={String(data.appointments.length)}
          icon={CalendarDays}
          color="text-purple-600"
          bg="bg-purple-50"
          href="/calendar"
        />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Tasks */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-blue-500" />
                Tasks
              </CardTitle>
              <Link
                href="/tasks"
                className="text-xs text-rose-500 hover:underline"
              >
                View all
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.tasks.length === 0 ? (
              <p className="text-sm text-gray-400 py-2">All done! 🎉</p>
            ) : (
              data.tasks.slice(0, 4).map((task) => (
                <div
                  key={task.id}
                  className="flex items-start gap-2 py-1.5 border-b border-gray-50 last:border-0"
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${
                      task.priority === "high"
                        ? "bg-red-400"
                        : task.priority === "medium"
                        ? "bg-amber-400"
                        : "bg-gray-300"
                    }`}
                  />
                  <div className="min-w-0">
                    <p className="text-sm text-gray-700 truncate">{task.title}</p>
                    {task.due_date && (
                      <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
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

        {/* Appointments */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-purple-500" />
                Upcoming
              </CardTitle>
              <Link
                href="/calendar"
                className="text-xs text-rose-500 hover:underline"
              >
                View all
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.appointments.length === 0 ? (
              <p className="text-sm text-gray-400 py-2">No upcoming events</p>
            ) : (
              data.appointments.slice(0, 4).map((appt) => (
                <div
                  key={appt.id}
                  className="flex items-start gap-3 py-1.5 border-b border-gray-50 last:border-0"
                >
                  <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CalendarDays className="w-4 h-4 text-purple-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-gray-700 truncate font-medium">
                      {appt.title}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {formatAppointmentDate(appt.start_time)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Baby logs */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Baby className="w-4 h-4 text-pink-500" />
                Baby
              </CardTitle>
              <Link
                href="/baby"
                className="text-xs text-rose-500 hover:underline"
              >
                View all
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.babyLogs.length === 0 ? (
              <p className="text-sm text-gray-400 py-2">No logs yet</p>
            ) : (
              data.babyLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center gap-3 py-1.5 border-b border-gray-50 last:border-0"
                >
                  <Badge
                    variant="secondary"
                    className="text-xs capitalize bg-pink-50 text-pink-600 border-0"
                  >
                    {formatBabyLogType(log.type)}
                  </Badge>
                  <p className="text-xs text-gray-400 ml-auto">
                    {format(new Date(log.timestamp), "HH:mm")}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Shopping lists */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-orange-500" />
                Shopping
              </CardTitle>
              <Link
                href="/shopping"
                className="text-xs text-rose-500 hover:underline"
              >
                View all
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.shoppingLists.length === 0 ? (
              <p className="text-sm text-gray-400 py-2">No lists yet</p>
            ) : (
              data.shoppingLists.map((list) => {
                const items = (list.shopping_items as { checked: boolean }[]) ?? [];
                const done = items.filter((i) => i.checked).length;
                const total = items.length;
                return (
                  <div
                    key={list.id}
                    className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0"
                  >
                    <p className="text-sm text-gray-700">{list.title}</p>
                    <span className="text-xs text-gray-400">
                      {done}/{total}
                    </span>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Notes */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <FileText className="w-4 h-4 text-teal-500" />
                Notes
              </CardTitle>
              <Link
                href="/notes"
                className="text-xs text-rose-500 hover:underline"
              >
                View all
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.notes.length === 0 ? (
              <p className="text-sm text-gray-400 py-2">No notes yet</p>
            ) : (
              data.notes.map((note) => (
                <div
                  key={note.id}
                  className="py-1.5 border-b border-gray-50 last:border-0"
                >
                  <p className="text-sm text-gray-700 font-medium truncate">
                    {note.title}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {format(new Date(note.updated_at), "MMM d")}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Balance */}
        <Card
          className={`border-0 shadow-sm ${
            data.balance >= 0 ? "bg-emerald-50" : "bg-red-50"
          }`}
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <DollarSign
                className={`w-4 h-4 ${
                  data.balance >= 0 ? "text-emerald-600" : "text-red-500"
                }`}
              />
              Monthly balance
            </CardTitle>
            <CardDescription>This month so far</CardDescription>
          </CardHeader>
          <CardContent>
            <p
              className={`text-3xl font-bold ${
                data.balance >= 0 ? "text-emerald-700" : "text-red-600"
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
            <Link
              href="/expenses"
              className="text-xs text-rose-500 hover:underline mt-3 inline-block"
            >
              View details →
            </Link>
          </CardContent>
        </Card>
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
  color,
  bg,
  href,
}: {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bg: string;
  href: string;
}) {
  return (
    <Link href={href}>
      <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="p-4">
          <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center mb-3`}>
            <Icon className={`w-5 h-5 ${color}`} />
          </div>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-xs text-gray-500 mt-0.5">{title}</p>
        </CardContent>
      </Card>
    </Link>
  );
}
