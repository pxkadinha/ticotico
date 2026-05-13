"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Pencil, Clock, Utensils, Moon, Droplet, Star, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { updateBabyLog } from "./actions";
import { DeleteBabyLogButton } from "./delete-button";
import { useLanguage } from "@/components/providers/language-provider";
import { cn } from "@/lib/utils";
import type { BabyLog } from "@/types";

const TYPE_CONFIG: Record<string, { icon: typeof Utensils; color: string; bg: string }> = {
  feed:      { icon: Utensils, color: "text-orange-500", bg: "bg-orange-500/10" },
  sleep:     { icon: Moon,     color: "text-blue-500",   bg: "bg-blue-500/10"   },
  diaper:    { icon: Droplet,  color: "text-teal-500",   bg: "bg-teal-500/10"   },
  milestone: { icon: Star,     color: "text-yellow-500", bg: "bg-yellow-500/10" },
};

function EditBabyLogDialog({
  log,
  open,
  onOpenChange,
}: {
  log: BabyLog;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const { t } = useLanguage();
  const [isPending, startTransition] = useTransition();
  const meta = (log.metadata ?? {}) as Record<string, unknown>;

  const [type, setType] = useState<"feed" | "sleep" | "diaper" | "milestone">(log.type as "feed" | "sleep" | "diaper" | "milestone");
  const [feedType, setFeedType] = useState((meta.feed_type as string) ?? "breast");
  const [diaperType, setDiaperType] = useState((meta.diaper_type as string) ?? "wet");

  const LOG_TYPES = [
    { value: "feed",      label: t.baby.feed,      icon: Utensils, color: "text-orange-500 bg-orange-500/10" },
    { value: "sleep",     label: t.baby.sleep,     icon: Moon,     color: "text-blue-500 bg-blue-500/10"     },
    { value: "diaper",   label: t.baby.diaper,    icon: Droplet,  color: "text-teal-500 bg-teal-500/10"     },
    { value: "milestone", label: t.baby.milestone, icon: Star,     color: "text-yellow-500 bg-yellow-500/10" },
  ];

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set("type", type);
    if (type === "feed") formData.set("feed_type", feedType);
    if (type === "diaper") formData.set("diaper_type", diaperType);

    startTransition(async () => {
      try {
        await updateBabyLog(log.id, formData);
        toast.success(t.baby.updated);
        onOpenChange(false);
      } catch {
        toast.error(t.baby.couldNotUpdate);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t.baby.editLog}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {LOG_TYPES.map(({ value, label, icon: Icon, color }) => (
              <button
                key={value}
                type="button"
                onClick={() => setType(value as "feed" | "sleep" | "diaper" | "milestone")}
                className={cn(
                  "flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all",
                  type === value
                    ? `${color} border-transparent ring-2 ring-offset-1 ring-current`
                    : "border-border text-muted-foreground hover:border-border/80"
                )}
              >
                <Icon className="w-4 h-4" />{label}
              </button>
            ))}
          </div>

          {type === "feed" && (
            <div className="space-y-3">
              <div className="flex rounded-lg border border-border p-1 gap-1">
                {(["breast", "bottle"] as const).map((ft) => (
                  <button key={ft} type="button" onClick={() => setFeedType(ft)}
                    className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-all ${feedType === ft ? "bg-orange-500 text-white" : "text-muted-foreground hover:text-foreground"}`}>
                    {ft === "breast" ? t.baby.breast : t.baby.bottle}
                  </button>
                ))}
              </div>
              {feedType === "bottle" && (
                <div className="space-y-1">
                  <Label htmlFor="edit-amount_ml">{t.baby.amountMl}</Label>
                  <Input id="edit-amount_ml" name="amount_ml" type="number" min="0"
                    defaultValue={meta.amount_ml ? String(meta.amount_ml) : ""} />
                </div>
              )}
              <div className="space-y-1">
                <Label htmlFor="edit-duration">{t.baby.durationMin}</Label>
                <Input id="edit-duration" name="duration_minutes" type="number" min="1"
                  defaultValue={log.duration_minutes ? String(log.duration_minutes) : ""} />
              </div>
            </div>
          )}

          {type === "sleep" && (
            <div className="space-y-1">
              <Label htmlFor="edit-sleep-dur">{t.baby.durationMin}</Label>
              <Input id="edit-sleep-dur" name="duration_minutes" type="number" min="1"
                defaultValue={log.duration_minutes ? String(log.duration_minutes) : ""} />
            </div>
          )}

          {type === "diaper" && (
            <div className="flex rounded-lg border border-border p-1 gap-1">
              {(["wet", "dirty", "both"] as const).map((dt) => (
                <button key={dt} type="button" onClick={() => setDiaperType(dt)}
                  className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-all ${diaperType === dt ? "bg-teal-500 text-white" : "text-muted-foreground hover:text-foreground"}`}>
                  {dt === "wet" ? t.baby.wet : dt === "dirty" ? t.baby.dirty : t.baby.both}
                </button>
              ))}
            </div>
          )}

          {type === "milestone" && (
            <div className="space-y-1">
              <Label htmlFor="edit-milestone">{t.baby.milestoneTitle}</Label>
              <Input id="edit-milestone" name="milestone_title"
                defaultValue={(meta.title as string) ?? ""}
                placeholder={t.baby.milestonePlaceholder} required={type === "milestone"} />
            </div>
          )}

          <div className="space-y-1">
            <Label htmlFor="edit-timestamp">{t.baby.dateTime}</Label>
            <Input id="edit-timestamp" name="timestamp" type="datetime-local"
              defaultValue={format(new Date(log.timestamp), "yyyy-MM-dd'T'HH:mm")} />
          </div>

          <div className="space-y-1">
            <Label htmlFor="edit-notes">{t.baby.notes}</Label>
            <Textarea id="edit-notes" name="notes" placeholder={t.baby.observations}
              defaultValue={log.notes ?? ""} rows={2} className="resize-none" />
          </div>

          <Button type="submit" disabled={isPending} className="w-full bg-rose-500 hover:bg-rose-600 text-white">
            {isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            {t.baby.saveChanges}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function BabyLogItem({
  log,
  label,
  detail,
  dateStr,
}: {
  log: BabyLog;
  label: string;
  detail: string;
  dateStr: string;
}) {
  const config = TYPE_CONFIG[log.type] ?? TYPE_CONFIG.feed;
  const Icon = config.icon;
  const [editing, setEditing] = useState(false);

  return (
    <>
      <div className="flex items-center gap-3 p-4 bg-card rounded-xl border border-border shadow-sm group hover:border-border/80 transition-all">
        <div className={`w-9 h-9 ${config.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
          <Icon className={`w-4 h-4 ${config.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className={`text-xs border-0 ${config.bg} ${config.color}`}>{label}</Badge>
            {detail && <span className="text-sm text-foreground">{detail}</span>}
          </div>
          {log.notes && <p className="text-xs text-muted-foreground mt-0.5 truncate">{log.notes}</p>}
        </div>
        <span className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
          <Clock className="w-3 h-3" />{dateStr}
        </span>
        <div className="flex items-center gap-0.5 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="w-7 h-7 text-muted-foreground/30 hover:text-purple-400 hover:bg-purple-500/10"
            onClick={() => setEditing(true)}
          >
            <Pencil className="w-3 h-3" />
          </Button>
          <DeleteBabyLogButton id={log.id} />
        </div>
      </div>
      <EditBabyLogDialog log={log} open={editing} onOpenChange={setEditing} />
    </>
  );
}
