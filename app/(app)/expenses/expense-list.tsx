"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Trash2, Loader2, ArrowUpRight, ArrowDownRight, Pencil } from "lucide-react";
import { toast } from "sonner";
import { deleteExpense, updateExpense } from "./actions";
import type { Expense } from "@/types";
import { useLanguage } from "@/components/providers/language-provider";

const CATEGORY_COLORS: Record<string, string> = {
  food: "bg-orange-500/10 text-orange-600",
  health: "bg-blue-500/10 text-blue-600",
  home: "bg-muted text-muted-foreground",
  baby: "bg-pink-500/10 text-pink-600",
  transport: "bg-yellow-500/10 text-yellow-600",
  entertainment: "bg-purple-500/10 text-purple-600",
  other: "bg-muted text-muted-foreground",
};

function EditExpenseDialog({
  expense,
  open,
  onOpenChange,
}: {
  expense: Expense;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const { t } = useLanguage();
  const [isPending, startTransition] = useTransition();
  const [type, setType] = useState(expense.type);
  const [category, setCategory] = useState(expense.category);

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
        await updateExpense(expense.id, formData);
        toast.success(t.expenses.updated);
        onOpenChange(false);
      } catch {
        toast.error(t.expenses.couldNotUpdate);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{t.expenses.editTransaction}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex rounded-lg border border-border p-1 gap-1">
            {(["expense", "income"] as const).map((tp) => (
              <button
                key={tp}
                type="button"
                onClick={() => setType(tp)}
                className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-all ${
                  type === tp
                    ? tp === "expense" ? "bg-red-500 text-white" : "bg-emerald-500 text-white"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tp === "expense" ? t.expenses.expensesLabel : t.expenses.income}
              </button>
            ))}
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-amount">{t.expenses.amount}</Label>
            <Input
              id="edit-amount"
              name="amount"
              type="number"
              step="0.01"
              min="0.01"
              defaultValue={String(expense.amount)}
              required
            />
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
            <Label htmlFor="edit-desc">{t.expenses.description}</Label>
            <Input
              id="edit-desc"
              name="description"
              defaultValue={expense.description ?? ""}
              placeholder={t.expenses.optionalNote}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-date">{t.expenses.date}</Label>
            <Input
              id="edit-date"
              name="date"
              type="date"
              defaultValue={expense.date}
              required
            />
          </div>
          <Button type="submit" disabled={isPending} className="w-full bg-rose-500 hover:bg-rose-600 text-white">
            {isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            {t.expenses.saveChanges}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ExpenseRow({ expense }: { expense: Expense }) {
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const { t } = useLanguage();

  return (
    <>
      <div className="flex items-center gap-3 px-6 py-3.5 group hover:bg-muted/30">
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
          expense.type === "income" ? "bg-emerald-500/10" : "bg-red-500/10"
        }`}>
          {expense.type === "income"
            ? <ArrowUpRight className="w-4 h-4 text-emerald-500" />
            : <ArrowDownRight className="w-4 h-4 text-red-500" />}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">
            {expense.description || t.expenses.categoryLabels[expense.category as keyof typeof t.expenses.categoryLabels]}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-muted-foreground">{format(new Date(expense.date), "d MMM")}</span>
            <Badge variant="secondary" className={`text-xs border-0 px-1.5 py-0 ${CATEGORY_COLORS[expense.category]}`}>
              {t.expenses.categoryLabels[expense.category as keyof typeof t.expenses.categoryLabels]}
            </Badge>
          </div>
        </div>

        <span className={`text-sm font-semibold ${expense.type === "income" ? "text-emerald-500" : "text-red-500"}`}>
          {expense.type === "income" ? "+" : "-"}€{Number(expense.amount).toFixed(2)}
        </span>

        <div className="flex items-center gap-0.5 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="w-7 h-7 text-muted-foreground/50 hover:text-purple-400 hover:bg-purple-500/10 flex-shrink-0"
            onClick={() => setEditing(true)}
          >
            <Pencil className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="w-7 h-7 text-muted-foreground/50 hover:text-red-400 hover:bg-red-500/10 flex-shrink-0"
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                try {
                  await deleteExpense(expense.id);
                  toast.success(t.expenses.deleted);
                } catch {
                  toast.error(t.expenses.couldNotDelete);
                }
              })
            }
          >
            {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
          </Button>
        </div>
      </div>

      <EditExpenseDialog expense={expense} open={editing} onOpenChange={setEditing} />
    </>
  );
}

export function ExpenseList({ expenses }: { expenses: Expense[] }) {
  const { t } = useLanguage();

  if (expenses.length === 0) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="py-16 text-center text-muted-foreground">
          {t.expenses.noTransactions}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-base">{t.expenses.allTransactions}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border">
          {expenses.map((expense) => (
            <ExpenseRow key={expense.id} expense={expense} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
