import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { ExpenseForm } from "./expense-form";
import { ExpenseList } from "./expense-list";
import type { Expense } from "@/types";
import { getT } from "@/lib/i18n/server";

export default async function ExpensesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: member } = await supabase
    .from("family_members").select("family_id").eq("user_id", user.id).single();
  if (!member) redirect("/dashboard");

  const t = await getT();
  const now = new Date();
  const monthStart = startOfMonth(now).toISOString().split("T")[0];
  const monthEnd = endOfMonth(now).toISOString().split("T")[0];

  const { data: expenses } = await supabase
    .from("expenses").select("*").eq("family_id", member.family_id)
    .gte("date", monthStart).lte("date", monthEnd).order("date", { ascending: false });

  const { data: allExpenses } = await supabase
    .from("expenses").select("*").eq("family_id", member.family_id)
    .order("date", { ascending: false }).limit(50);

  const monthExpenses = expenses ?? [];
  const totalIncome = monthExpenses.filter((e) => e.type === "income").reduce((s, e) => s + Number(e.amount), 0);
  const totalExpense = monthExpenses.filter((e) => e.type === "expense").reduce((s, e) => s + Number(e.amount), 0);
  const balance = totalIncome - totalExpense;

  const categoryMap: Record<string, number> = {};
  monthExpenses.filter((e) => e.type === "expense").forEach((e) => {
    categoryMap[e.category] = (categoryMap[e.category] ?? 0) + Number(e.amount);
  });
  const categories = Object.entries(categoryMap).sort((a, b) => b[1] - a[1]);

  return (
    <div className="max-w-5xl mx-auto space-y-8 pt-4 md:pt-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t.expenses.title}</h1>
        <p className="text-muted-foreground mt-1">{format(now, "MMMM yyyy")}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
              </div>
              <span className="text-sm text-emerald-600 font-medium">{t.expenses.income}</span>
            </div>
            <p className="text-2xl font-bold text-emerald-600">€{totalIncome.toFixed(2)}</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-red-500/10 rounded-lg flex items-center justify-center">
                <TrendingDown className="w-4 h-4 text-red-500" />
              </div>
              <span className="text-sm text-red-500 font-medium">{t.expenses.expensesLabel}</span>
            </div>
            <p className="text-2xl font-bold text-red-500">€{totalExpense.toFixed(2)}</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${balance >= 0 ? "bg-blue-500/10" : "bg-orange-500/10"}`}>
                <Wallet className={`w-4 h-4 ${balance >= 0 ? "text-blue-500" : "text-orange-500"}`} />
              </div>
              <span className={`text-sm font-medium ${balance >= 0 ? "text-blue-500" : "text-orange-500"}`}>{t.expenses.balance}</span>
            </div>
            <p className={`text-2xl font-bold ${balance >= 0 ? "text-blue-500" : "text-orange-500"}`}>
              {balance >= 0 ? "+" : ""}€{balance.toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card className="border-0 shadow-sm">
            <CardHeader><CardTitle className="text-base">{t.expenses.addTransaction}</CardTitle></CardHeader>
            <CardContent><ExpenseForm /></CardContent>
          </Card>

          {categories.length > 0 && (
            <Card className="border-0 shadow-sm mt-4">
              <CardHeader><CardTitle className="text-base">{t.expenses.byCategory}</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {categories.map(([cat, amount]) => (
                  <div key={cat} className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {t.expenses.categoryLabels[cat as keyof typeof t.expenses.categoryLabels] ?? cat}
                    </span>
                    <span className="text-sm font-medium text-foreground">€{amount.toFixed(2)}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="lg:col-span-2">
          <ExpenseList expenses={(allExpenses ?? []) as Expense[]} />
        </div>
      </div>
    </div>
  );
}
