"use client";

import { useState, useTransition } from "react";
import { DollarSign, CheckSquare, CalendarDays, MessageCircle, Baby, ShoppingCart, FileText } from "lucide-react";
import { toast } from "sonner";
import { updateEnabledModules } from "./actions";
import type { EnabledModules, ModuleId } from "@/types";
import { ALL_MODULE_IDS } from "@/types";
import { useLanguage } from "@/components/providers/language-provider";

const MODULE_ICONS: Record<ModuleId, React.ReactNode> = {
  expenses:      <DollarSign className="w-4 h-4" />,
  tasks:         <CheckSquare className="w-4 h-4" />,
  calendar:      <CalendarDays className="w-4 h-4" />,
  chat:          <MessageCircle className="w-4 h-4" />,
  baby:          <Baby className="w-4 h-4" />,
  shopping:      <ShoppingCart className="w-4 h-4" />,
  notes:         <FileText className="w-4 h-4" />,
};

const MODULE_COLORS: Record<ModuleId, string> = {
  expenses:  "bg-emerald-500/10 text-emerald-600",
  tasks:     "bg-blue-500/10 text-blue-600",
  calendar:  "bg-violet-500/10 text-violet-600",
  chat:      "bg-rose-500/10 text-rose-500",
  baby:      "bg-pink-500/10 text-pink-600",
  shopping:  "bg-orange-500/10 text-orange-600",
  notes:     "bg-amber-500/10 text-amber-600",
};

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 disabled:opacity-50 ${
        checked ? "bg-rose-500" : "bg-muted"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

interface ModulesSectionProps {
  initialModules: EnabledModules;
}

export function ModulesSection({ initialModules }: ModulesSectionProps) {
  const { t } = useLanguage();
  const [modules, setModules] = useState<EnabledModules>(initialModules);
  const [isPending, startTransition] = useTransition();

  function handleToggle(id: ModuleId, value: boolean) {
    const next = { ...modules, [id]: value };
    setModules(next);
    startTransition(async () => {
      try {
        await updateEnabledModules(next);
        toast.success(t.settings.modulesSaved);
      } catch {
        // revert on error
        setModules(modules);
        toast.error("Could not update modules");
      }
    });
  }

  const moduleLabels: Record<ModuleId, string> = {
    expenses: t.nav.expenses,
    tasks:    t.nav.tasks,
    calendar: t.nav.calendar,
    chat:     t.nav.chat,
    baby:     t.nav.baby,
    shopping: t.nav.shopping,
    notes:    t.nav.notes,
  };

  return (
    <div className="space-y-1">
      {ALL_MODULE_IDS.map((id) => (
        <div key={id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${MODULE_COLORS[id]}`}>
              {MODULE_ICONS[id]}
            </div>
            <span className="text-sm font-medium text-foreground">{moduleLabels[id]}</span>
          </div>
          <Toggle
            checked={modules[id]}
            onChange={(v) => handleToggle(id, v)}
            disabled={isPending}
          />
        </div>
      ))}
    </div>
  );
}
