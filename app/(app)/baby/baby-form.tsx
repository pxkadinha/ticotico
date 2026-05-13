"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Utensils, Moon, Droplet, Star } from "lucide-react";
import { toast } from "sonner";
import { addBabyLog } from "./actions";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/components/providers/language-provider";

export function BabyForm() {
  const [isPending, startTransition] = useTransition();
  const [type, setType] = useState("feed");
  const [feedType, setFeedType] = useState("breast");
  const [diaperType, setDiaperType] = useState("wet");
  const { t } = useLanguage();

  const LOG_TYPES = [
    { value: "feed", label: t.baby.feed, icon: Utensils, color: "text-orange-500 bg-orange-500/10" },
    { value: "sleep", label: t.baby.sleep, icon: Moon, color: "text-blue-500 bg-blue-500/10" },
    { value: "diaper", label: t.baby.diaper, icon: Droplet, color: "text-teal-500 bg-teal-500/10" },
    { value: "milestone", label: t.baby.milestone, icon: Star, color: "text-yellow-500 bg-yellow-500/10" },
  ];

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set("type", type);
    if (type === "feed") formData.set("feed_type", feedType);
    if (type === "diaper") formData.set("diaper_type", diaperType);
    startTransition(async () => {
      try {
        await addBabyLog(formData);
        toast.success(t.baby.added);
        (e.target as HTMLFormElement).reset();
      } catch (err) {
        toast.error((err as Error).message);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        {LOG_TYPES.map(({ value, label, icon: Icon, color }) => (
          <button
            key={value}
            type="button"
            onClick={() => setType(value)}
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
              <Label htmlFor="amount_ml">{t.baby.amountMl}</Label>
              <Input id="amount_ml" name="amount_ml" type="number" min="0" placeholder="120" />
            </div>
          )}
          <div className="space-y-1">
            <Label htmlFor="duration_minutes">{t.baby.durationMin}</Label>
            <Input id="duration_minutes" name="duration_minutes" type="number" min="1" placeholder="15" />
          </div>
        </div>
      )}

      {type === "sleep" && (
        <div className="space-y-1">
          <Label htmlFor="duration_minutes">{t.baby.durationMin}</Label>
          <Input id="duration_minutes" name="duration_minutes" type="number" min="1" placeholder="90" />
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
          <Label htmlFor="milestone_title">{t.baby.milestoneTitle}</Label>
          <Input id="milestone_title" name="milestone_title" placeholder={t.baby.milestonePlaceholder} required={type === "milestone"} />
        </div>
      )}

      <div className="space-y-1">
        <Label htmlFor="timestamp">{t.baby.dateTime}</Label>
        <Input id="timestamp" name="timestamp" type="datetime-local" defaultValue={format(new Date(), "yyyy-MM-dd'T'HH:mm")} />
      </div>

      <div className="space-y-1">
        <Label htmlFor="notes">{t.baby.notes}</Label>
        <Textarea id="notes" name="notes" placeholder={t.baby.observations} rows={2} className="resize-none" />
      </div>

      <Button type="submit" disabled={isPending} className="w-full bg-rose-500 hover:bg-rose-600 text-white">
        {isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
        {t.baby.logButton}
      </Button>
    </form>
  );
}
