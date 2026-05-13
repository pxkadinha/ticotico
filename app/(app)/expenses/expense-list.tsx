"use client";

import { useTransition } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { toast } from "sonner";
import { deleteExpense } from "./actions";
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

function DeleteButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();
  const { t } = useLanguage();

  return (
    <Button
      variant="ghost"
      size="icon"
      className="w-7 h-7 text-muted-foreground/50 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          try {
            await deleteExpense(id);
            toast.success(t.expenses.deleted);
          } catch {
            toast.error(t.expenses.couldNotDelete);
          }
        })
      }
    >
      {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
    </Button>
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
            <div
              key={expense.id}
              className="flex items-center gap-3 px-6 py-3.5 group hover:bg-muted/30"
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  expense.type === "income" ? "bg-emerald-500/10" : "bg-red-500/10"
                }`}
              >
                {expense.type === "income" ? (
                  <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                ) : (
                  <ArrowDownRight className="w-4 h-4 text-red-500" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {expense.description || t.expenses.categoryLabels[expense.category as keyof typeof t.expenses.categoryLabels]}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(expense.date), "d MMM")}
                  </span>
                  <Badge
                    variant="secondary"
                    className={`text-xs border-0 px-1.5 py-0 ${CATEGORY_COLORS[expense.category]}`}
                  >
                    {t.expenses.categoryLabels[expense.category as keyof typeof t.expenses.categoryLabels]}
                  </Badge>
                </div>
              </div>

              <span className={`text-sm font-semibold ${expense.type === "income" ? "text-emerald-500" : "text-red-500"}`}>
                {expense.type === "income" ? "+" : "-"}€{Number(expense.amount).toFixed(2)}
              </span>

              <DeleteButton id={expense.id} />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
