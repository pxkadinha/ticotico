import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { format, isToday, isYesterday } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Utensils, Moon, Droplet, Star, Clock } from "lucide-react";
import { BabyForm } from "./baby-form";
import { DeleteBabyLogButton } from "./delete-button";
import type { BabyLog } from "@/types";
import { getT } from "@/lib/i18n/server";

function getTodayStats(logs: BabyLog[]) {
  const today = logs.filter((l) => isToday(new Date(l.timestamp)));
  const feeds = today.filter((l) => l.type === "feed").length;
  const sleepMin = today.filter((l) => l.type === "sleep").reduce((s, l) => s + (l.duration_minutes ?? 0), 0);
  const diapers = today.filter((l) => l.type === "diaper").length;
  return { feeds, sleepMin, diapers };
}

function getLogDetail(log: BabyLog, t: Awaited<ReturnType<typeof getT>>): string {
  const meta = log.metadata as Record<string, unknown> | null;
  if (log.type === "feed") {
    const feedType = (meta?.feed_type as string) === "breast" ? t.baby.breast : t.baby.bottle;
    const amount = meta?.amount_ml ? ` · ${meta.amount_ml}ml` : "";
    const dur = log.duration_minutes ? ` · ${log.duration_minutes}min` : "";
    return `${feedType}${amount}${dur}`;
  }
  if (log.type === "sleep") return log.duration_minutes ? `${log.duration_minutes} min` : "";
  if (log.type === "diaper") {
    const dtype = meta?.diaper_type as string;
    return dtype === "wet" ? t.baby.wet : dtype === "dirty" ? t.baby.dirty : t.baby.both;
  }
  if (log.type === "milestone") return (meta?.title as string) ?? t.baby.milestone;
  return "";
}

export default async function BabyPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: member } = await supabase
    .from("family_members").select("family_id").eq("user_id", user.id).single();
  if (!member) redirect("/dashboard");

  const t = await getT();

  const { data: logs } = await supabase
    .from("baby_logs").select("*").eq("family_id", member.family_id)
    .order("timestamp", { ascending: false }).limit(50);

  const allLogs = (logs ?? []) as BabyLog[];
  const { feeds, sleepMin, diapers } = getTodayStats(allLogs);
  const milestones = allLogs.filter((l) => l.type === "milestone");

  const TYPE_CONFIG: Record<string, { label: string; icon: typeof Utensils; color: string; bg: string }> = {
    feed: { label: t.baby.feed, icon: Utensils, color: "text-orange-500", bg: "bg-orange-500/10" },
    sleep: { label: t.baby.sleep, icon: Moon, color: "text-blue-500", bg: "bg-blue-500/10" },
    diaper: { label: t.baby.diaper, icon: Droplet, color: "text-teal-500", bg: "bg-teal-500/10" },
    milestone: { label: t.baby.milestone, icon: Star, color: "text-yellow-500", bg: "bg-yellow-500/10" },
  };

  function formatLogDate(dateStr: string) {
    const d = new Date(dateStr);
    if (isToday(d)) return `${t.calendar.today} ${format(d, "HH:mm")}`;
    if (isYesterday(d)) return `${t.calendar.yesterday} ${format(d, "HH:mm")}`;
    return format(d, "d MMM, HH:mm");
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pt-4 md:pt-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t.baby.title}</h1>
        <p className="text-muted-foreground mt-1">{t.baby.subtitle}</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 text-center">
            <Utensils className="w-5 h-5 text-orange-500 mx-auto mb-1" />
            <p className="text-2xl font-bold text-foreground">{feeds}</p>
            <p className="text-xs text-muted-foreground">{t.baby.feedsToday}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 text-center">
            <Moon className="w-5 h-5 text-blue-500 mx-auto mb-1" />
            <p className="text-2xl font-bold text-foreground">
              {sleepMin >= 60 ? `${Math.floor(sleepMin / 60)}h${sleepMin % 60 > 0 ? `${sleepMin % 60}m` : ""}` : `${sleepMin}m`}
            </p>
            <p className="text-xs text-muted-foreground">{t.baby.sleepToday}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 text-center">
            <Droplet className="w-5 h-5 text-teal-500 mx-auto mb-1" />
            <p className="text-2xl font-bold text-foreground">{diapers}</p>
            <p className="text-xs text-muted-foreground">{t.baby.diapersToday}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <Card className="border-0 shadow-sm">
            <CardHeader><CardTitle className="text-base">{t.baby.logEntry}</CardTitle></CardHeader>
            <CardContent><BabyForm /></CardContent>
          </Card>
          {milestones.length > 0 && (
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-500" />{t.baby.milestones}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {milestones.slice(0, 5).map((m) => {
                  const meta = m.metadata as Record<string, unknown> | null;
                  return (
                    <div key={m.id} className="flex items-start gap-2">
                      <Star className="w-3 h-3 text-yellow-500 mt-0.5 flex-shrink-0" fill="currentColor" />
                      <div>
                        <p className="text-sm text-foreground">{(meta?.title as string) ?? t.baby.milestone}</p>
                        <p className="text-xs text-muted-foreground">{format(new Date(m.timestamp), "d MMM yyyy")}</p>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="lg:col-span-2">
          <h2 className="text-sm font-semibold text-muted-foreground mb-3">{t.baby.recentLogs}</h2>
          {allLogs.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="py-16 text-center text-muted-foreground">
                <p className="text-4xl mb-3">👶</p>
                <p>{t.baby.noLogs}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {allLogs.map((log) => {
                const config = TYPE_CONFIG[log.type] ?? TYPE_CONFIG.feed;
                const Icon = config.icon;
                const detail = getLogDetail(log, t);
                return (
                  <div key={log.id} className="flex items-center gap-3 p-4 bg-card rounded-xl border border-border shadow-sm group hover:border-border/80 transition-all">
                    <div className={`w-9 h-9 ${config.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-4 h-4 ${config.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className={`text-xs border-0 ${config.bg} ${config.color}`}>{config.label}</Badge>
                        {detail && <span className="text-sm text-foreground">{detail}</span>}
                      </div>
                      {log.notes && <p className="text-xs text-muted-foreground mt-0.5 truncate">{log.notes}</p>}
                    </div>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                      <Clock className="w-3 h-3" />{formatLogDate(log.timestamp)}
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
