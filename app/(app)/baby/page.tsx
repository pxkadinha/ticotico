import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { format, isToday, isYesterday } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Utensils,
  Moon,
  Droplet,
  Star,
  Trash2,
  Clock,
} from "lucide-react";
import { BabyForm } from "./baby-form";
import { DeleteBabyLogButton } from "./delete-button";
import type { BabyLog } from "@/types";

const TYPE_CONFIG: Record<
  string,
  { label: string; icon: React.ComponentType<{ className?: string }>; color: string; bg: string }
> = {
  feed: { label: "Feed", icon: Utensils, color: "text-orange-600", bg: "bg-orange-50" },
  sleep: { label: "Sleep", icon: Moon, color: "text-blue-600", bg: "bg-blue-50" },
  diaper: { label: "Diaper", icon: Droplet, color: "text-teal-600", bg: "bg-teal-50" },
  milestone: { label: "Milestone", icon: Star, color: "text-yellow-600", bg: "bg-yellow-50" },
};

function formatLogDate(dateStr: string) {
  const d = new Date(dateStr);
  if (isToday(d)) return `Today ${format(d, "HH:mm")}`;
  if (isYesterday(d)) return `Yesterday ${format(d, "HH:mm")}`;
  return format(d, "MMM d, HH:mm");
}

function getLogDetail(log: BabyLog): string {
  const meta = log.metadata as Record<string, unknown> | null;
  if (log.type === "feed") {
    const feedType = (meta?.feed_type as string) ?? "breast";
    const amount = meta?.amount_ml ? ` · ${meta.amount_ml}ml` : "";
    const dur = log.duration_minutes ? ` · ${log.duration_minutes}min` : "";
    return `${feedType.charAt(0).toUpperCase() + feedType.slice(1)}${amount}${dur}`;
  }
  if (log.type === "sleep") {
    return log.duration_minutes ? `${log.duration_minutes} min` : "";
  }
  if (log.type === "diaper") {
    const dtype = (meta?.diaper_type as string) ?? "wet";
    return dtype.charAt(0).toUpperCase() + dtype.slice(1);
  }
  if (log.type === "milestone") {
    return (meta?.title as string) ?? "Milestone";
  }
  return "";
}

// Stats for today
function getTodayStats(logs: BabyLog[]) {
  const today = logs.filter((l) => isToday(new Date(l.timestamp)));
  const feeds = today.filter((l) => l.type === "feed").length;
  const sleepMin = today
    .filter((l) => l.type === "sleep")
    .reduce((s, l) => s + (l.duration_minutes ?? 0), 0);
  const diapers = today.filter((l) => l.type === "diaper").length;
  return { feeds, sleepMin, diapers };
}

export default async function BabyPage() {
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

  const { data: logs } = await supabase
    .from("baby_logs")
    .select("*")
    .eq("family_id", member.family_id)
    .order("timestamp", { ascending: false })
    .limit(50);

  const allLogs = (logs ?? []) as BabyLog[];
  const { feeds, sleepMin, diapers } = getTodayStats(allLogs);
  const milestones = allLogs.filter((l) => l.type === "milestone");

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Baby Tracking</h1>
        <p className="text-gray-500 mt-1">
          Keep track of feeds, sleep, diapers, and milestones
        </p>
      </div>

      {/* Today's summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm bg-orange-50">
          <CardContent className="p-4 text-center">
            <Utensils className="w-5 h-5 text-orange-500 mx-auto mb-1" />
            <p className="text-2xl font-bold text-orange-700">{feeds}</p>
            <p className="text-xs text-orange-600">Feeds today</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-blue-50">
          <CardContent className="p-4 text-center">
            <Moon className="w-5 h-5 text-blue-500 mx-auto mb-1" />
            <p className="text-2xl font-bold text-blue-700">
              {sleepMin >= 60
                ? `${Math.floor(sleepMin / 60)}h${sleepMin % 60 > 0 ? `${sleepMin % 60}m` : ""}`
                : `${sleepMin}m`}
            </p>
            <p className="text-xs text-blue-600">Sleep today</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-teal-50">
          <CardContent className="p-4 text-center">
            <Droplet className="w-5 h-5 text-teal-500 mx-auto mb-1" />
            <p className="text-2xl font-bold text-teal-700">{diapers}</p>
            <p className="text-xs text-teal-600">Diapers today</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="space-y-4">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Log entry</CardTitle>
            </CardHeader>
            <CardContent>
              <BabyForm />
            </CardContent>
          </Card>

          {/* Milestones */}
          {milestones.length > 0 && (
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-500" />
                  Milestones
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {milestones.slice(0, 5).map((m) => {
                  const meta = m.metadata as Record<string, unknown> | null;
                  return (
                    <div key={m.id} className="flex items-start gap-2">
                      <Star className="w-3 h-3 text-yellow-500 mt-0.5 flex-shrink-0" fill="currentColor" />
                      <div>
                        <p className="text-sm text-gray-800">
                          {(meta?.title as string) ?? "Milestone"}
                        </p>
                        <p className="text-xs text-gray-400">
                          {format(new Date(m.timestamp), "MMM d, yyyy")}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Timeline */}
        <div className="lg:col-span-2">
          <h2 className="text-sm font-semibold text-gray-500 mb-3">
            Recent logs
          </h2>
          {allLogs.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="py-16 text-center text-gray-400">
                <p className="text-4xl mb-3">👶</p>
                <p>No logs yet. Start tracking your baby!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {allLogs.map((log) => {
                const config = TYPE_CONFIG[log.type] ?? TYPE_CONFIG.feed;
                const Icon = config.icon;
                const detail = getLogDetail(log);

                return (
                  <div
                    key={log.id}
                    className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-100 shadow-sm group hover:border-gray-200 transition-all"
                  >
                    <div
                      className={`w-9 h-9 ${config.bg} rounded-xl flex items-center justify-center flex-shrink-0`}
                    >
                      <Icon className={`w-4 h-4 ${config.color}`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="secondary"
                          className={`text-xs border-0 ${config.bg} ${config.color}`}
                        >
                          {config.label}
                        </Badge>
                        {detail && (
                          <span className="text-sm text-gray-700">{detail}</span>
                        )}
                      </div>
                      {log.notes && (
                        <p className="text-xs text-gray-400 mt-0.5 truncate">
                          {log.notes}
                        </p>
                      )}
                    </div>

                    <span className="flex items-center gap-1 text-xs text-gray-400 flex-shrink-0">
                      <Clock className="w-3 h-3" />
                      {formatLogDate(log.timestamp)}
                    </span>

                    <DeleteBabyLogButton id={log.id} />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
