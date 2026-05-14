"use client";

import { useState, type ReactNode } from "react";
import { useLanguage } from "@/components/providers/language-provider";
import { cn } from "@/lib/utils";

export function ExpensesTabs({
  overview,
  recurring,
}: {
  overview: ReactNode;
  recurring: ReactNode;
}) {
  const [tab, setTab] = useState<"overview" | "recurring">("overview");
  const { t } = useLanguage();

  return (
    <div className="space-y-6">
      <div className="flex gap-1 p-1 rounded-lg border border-border bg-muted/30 w-fit">
        {(
          [
            ["overview", t.expenses.tabOverview],
            ["recurring", t.expenses.tabRecurring],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              "px-4 py-2 rounded-md text-sm font-medium transition-colors",
              tab === id
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === "overview" ? overview : recurring}
    </div>
  );
}
