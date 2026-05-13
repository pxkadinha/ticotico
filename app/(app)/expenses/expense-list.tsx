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

const CATEGORY_LABELS: Record<string, string> = {
  food: "Food",
  health: "Health",
  home: "Home",
  baby: "Baby",
  transport: "Transport",
  entertainment: "Entertainment",
  other: "Other",
};

const CATEGORY_COLORS: Record<string, string> = {
  food: "bg-orange-50 text-orange-700",
  health: "bg-blue-50 text-blue-700",
  home: "bg-gray-50 text-gray-700",
  baby: "bg-pink-50 text-pink-700",
  transport: "bg-yellow-50 text-yellow-700",
  entertainment: "bg-purple-50 text-purple-700",
  other: "bg-gray-50 text-gray-600",
};

function DeleteButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="ghost"
      size="icon"
      className="w-7 h-7 text-gray-300 hover:text-red-400 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          try {
            await deleteExpense(id);
            toast.success("Deleted");
          } catch {
            toast.error("Could not delete");
          }
        })
      }
    >
      {isPending ? (
        <Loader2 className="w-3 h-3 animate-spin" />
      ) : (
        <Trash2 className="w-3 h-3" />
      )}
    </Button>
  );
}

export function ExpenseList({ expenses }: { expenses: Expense[] }) {
  if (expenses.length === 0) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="py-16 text-center text-gray-400">
          No transactions yet. Add your first one!
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-base">All transactions</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-gray-50">
          {expenses.map((expense) => (
            <div
              key={expense.id}
              className="flex items-center gap-3 px-6 py-3.5 group hover:bg-gray-50/50"
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  expense.type === "income" ? "bg-emerald-50" : "bg-red-50"
                }`}
              >
                {expense.type === "income" ? (
                  <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                ) : (
                  <ArrowDownRight className="w-4 h-4 text-red-500" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">
                  {expense.description || CATEGORY_LABELS[expense.category]}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-gray-400">
                    {format(new Date(expense.date), "MMM d")}
                  </span>
                  <Badge
                    variant="secondary"
                    className={`text-xs border-0 px-1.5 py-0 ${CATEGORY_COLORS[expense.category]}`}
                  >
                    {CATEGORY_LABELS[expense.category]}
                  </Badge>
                </div>
              </div>

              <span
                className={`text-sm font-semibold ${
                  expense.type === "income" ? "text-emerald-700" : "text-red-600"
                }`}
              >
                {expense.type === "income" ? "+" : "-"}€
                {Number(expense.amount).toFixed(2)}
              </span>

              <DeleteButton id={expense.id} />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
