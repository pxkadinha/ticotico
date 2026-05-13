"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { addExpense } from "./actions";
import { useLanguage } from "@/components/providers/language-provider";

export function ExpenseForm() {
  const [isPending, startTransition] = useTransition();
  const [type, setType] = useState("expense");
  const [category, setCategory] = useState("other");
  const { t } = useLanguage();

  const CATEGORIES = [
    { value: "food", label: t.expenses.categories.food },
    { value: "health", label: t.expenses.categories.health },
    { value: "home", label: t.expenses.categories.home },
    { value: "baby", label: t.expenses.categories.baby },
    { value: "transport", label: t.expenses.categories.transport },
    { value: "entertainment", label: t.expenses.categories.entertainment },
    { value: "other", label: t.expenses.categories.other },
  ];

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set("type", type);
    formData.set("category", category);

    startTransition(async () => {
      try {
        await addExpense(formData);
        toast.success(t.expenses.added);
        (e.target as HTMLFormElement).reset();
      } catch (err) {
        toast.error((err as Error).message);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Type toggle */}
      <div className="flex rounded-lg border border-border p-1 gap-1">
        {(["expense", "income"] as const).map((tp) => (
          <button
            key={tp}
            type="button"
            onClick={() => setType(tp)}
            className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-all ${
              type === tp
                ? tp === "expense"
                  ? "bg-red-500 text-white"
                  : "bg-emerald-500 text-white"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tp === "expense" ? t.expenses.expensesLabel : t.expenses.income}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        <Label htmlFor="amount">{t.expenses.amount}</Label>
        <Input id="amount" name="amount" type="number" step="0.01" min="0.01" placeholder="0.00" required />
      </div>

      <div className="space-y-2">
        <Label>{t.expenses.category}</Label>
        <Select value={category} onValueChange={(v) => v && setCategory(v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">{t.expenses.description}</Label>
        <Input id="description" name="description" placeholder={t.expenses.optionalNote} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="date">{t.expenses.date}</Label>
        <Input id="date" name="date" type="date" defaultValue={format(new Date(), "yyyy-MM-dd")} required />
      </div>

      <Button type="submit" disabled={isPending} className="w-full bg-rose-500 hover:bg-rose-600 text-white">
        {isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
        {t.expenses.addTransaction}
      </Button>
    </form>
  );
}
