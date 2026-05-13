"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Utensils, Moon, Droplet, Star } from "lucide-react";
import { toast } from "sonner";
import { addBabyLog } from "./actions";
import { cn } from "@/lib/utils";

const LOG_TYPES = [
  { value: "feed", label: "Feed", icon: Utensils, color: "text-orange-500 bg-orange-50" },
  { value: "sleep", label: "Sleep", icon: Moon, color: "text-blue-500 bg-blue-50" },
  { value: "diaper", label: "Diaper", icon: Droplet, color: "text-teal-500 bg-teal-50" },
  { value: "milestone", label: "Milestone", icon: Star, color: "text-yellow-500 bg-yellow-50" },
];

export function BabyForm() {
  const [isPending, startTransition] = useTransition();
  const [type, setType] = useState("feed");
  const [feedType, setFeedType] = useState("breast");
  const [diaperType, setDiaperType] = useState("wet");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set("type", type);
    if (type === "feed") formData.set("feed_type", feedType);
    if (type === "diaper") formData.set("diaper_type", diaperType);

    startTransition(async () => {
      try {
        await addBabyLog(formData);
        toast.success("Log added");
        (e.target as HTMLFormElement).reset();
      } catch (err) {
        toast.error((err as Error).message);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Type buttons */}
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
                : "border-gray-200 text-gray-600 hover:border-gray-300"
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Feed-specific */}
      {type === "feed" && (
        <div className="space-y-3">
          <div className="flex rounded-lg border border-gray-200 p-1 gap-1">
            {["breast", "bottle"].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setFeedType(t)}
                className={`flex-1 py-1.5 rounded-md text-xs font-medium capitalize transition-all ${
                  feedType === t
                    ? "bg-orange-500 text-white"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          {feedType === "bottle" && (
            <div className="space-y-1">
              <Label htmlFor="amount_ml">Amount (ml)</Label>
              <Input
                id="amount_ml"
                name="amount_ml"
                type="number"
                min="0"
                placeholder="120"
              />
            </div>
          )}
          <div className="space-y-1">
            <Label htmlFor="duration_minutes">Duration (min)</Label>
            <Input
              id="duration_minutes"
              name="duration_minutes"
              type="number"
              min="1"
              placeholder="15"
            />
          </div>
        </div>
      )}

      {/* Sleep-specific */}
      {type === "sleep" && (
        <div className="space-y-1">
          <Label htmlFor="duration_minutes">Duration (min)</Label>
          <Input
            id="duration_minutes"
            name="duration_minutes"
            type="number"
            min="1"
            placeholder="90"
          />
        </div>
      )}

      {/* Diaper-specific */}
      {type === "diaper" && (
        <div className="flex rounded-lg border border-gray-200 p-1 gap-1">
          {["wet", "dirty", "both"].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setDiaperType(t)}
              className={`flex-1 py-1.5 rounded-md text-xs font-medium capitalize transition-all ${
                diaperType === t
                  ? "bg-teal-500 text-white"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      )}

      {/* Milestone-specific */}
      {type === "milestone" && (
        <div className="space-y-1">
          <Label htmlFor="milestone_title">Milestone title</Label>
          <Input
            id="milestone_title"
            name="milestone_title"
            placeholder="First smile, first word..."
            required={type === "milestone"}
          />
        </div>
      )}

      <div className="space-y-1">
        <Label htmlFor="timestamp">Date & time</Label>
        <Input
          id="timestamp"
          name="timestamp"
          type="datetime-local"
          defaultValue={format(new Date(), "yyyy-MM-dd'T'HH:mm")}
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="notes">Notes (optional)</Label>
        <Textarea
          id="notes"
          name="notes"
          placeholder="Any observations..."
          rows={2}
          className="resize-none"
        />
      </div>

      <Button
        type="submit"
        disabled={isPending}
        className="w-full bg-rose-500 hover:bg-rose-600 text-white"
      >
        {isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
        Log entry
      </Button>
    </form>
  );
}
