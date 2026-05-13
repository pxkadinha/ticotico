import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { ExpenseForm } from "./expense-form";
import { ExpenseList } from "./expense-list";
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

export default async function ExpensesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: member } = await supabase
    .from("family_members")
    .select("family_id")
    .eq("user_id", user.id)
    .single();
  if (!member) redirect("/dashboard");

  const now = new Date();
  const monthStart = startOfMonth(now).toISOString().split("T")[0];
  const monthEnd = endOfMonth(now).toISOString().split("T")[0];

  const { data: expenses } = await supabase
    .from("expenses")
    .select("*")
    .eq("family_id", member.family_id)
    .gte("date", monthStart)
    .lte("date", monthEnd)
    .order("date", { ascending: false });

  const { data: allExpenses } = await supabase
    .from("expenses")
    .select("*")
    .eq("family_id", member.family_id)
    .order("date", { ascending: false })
    .limit(50);

  const monthExpenses = expenses ?? [];
  const totalIncome = monthExpenses
    .filter((e) => e.type === "income")
    .reduce((s, e) => s + Number(e.amount), 0);
  const totalExpense = monthExpenses
    .filter((e) => e.type === "expense")
    .reduce((s, e) => s + Number(e.amount), 0);
  const balance = totalIncome - totalExpense;

  // Category breakdown
  const categoryMap: Record<string, number> = {};
  monthExpenses
    .filter((e) => e.type === "expense")
    .forEach((e) => {
      categoryMap[e.category] = (categoryMap[e.category] ?? 0) + Number(e.amount);
    });
  const categories = Object.entries(categoryMap).sort((a, b) => b[1] - a[1]);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Expenses</h1>
        <p className="text-gray-500 mt-1">{format(now, "MMMM yyyy")}</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm bg-emerald-50">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <span className="text-sm text-emerald-700 font-medium">Income</span>
            </div>
            <p className="text-2xl font-bold text-emerald-800">
              €{totalIncome.toFixed(2)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-red-50">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                <TrendingDown className="w-4 h-4 text-red-500" />
              </div>
              <span className="text-sm text-red-600 font-medium">Expenses</span>
            </div>
            <p className="text-2xl font-bold text-red-700">
              €{totalExpense.toFixed(2)}
            </p>
          </CardContent>
        </Card>
        <Card
          className={`border-0 shadow-sm ${balance >= 0 ? "bg-blue-50" : "bg-orange-50"}`}
        >
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-2">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  balance >= 0 ? "bg-blue-100" : "bg-orange-100"
                }`}
              >
                <Wallet
                  className={`w-4 h-4 ${balance >= 0 ? "text-blue-600" : "text-orange-500"}`}
                />
              </div>
              <span
                className={`text-sm font-medium ${balance >= 0 ? "text-blue-700" : "text-orange-600"}`}
              >
                Balance
              </span>
            </div>
            <p
              className={`text-2xl font-bold ${balance >= 0 ? "text-blue-800" : "text-orange-700"}`}
            >
              {balance >= 0 ? "+" : ""}€{balance.toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Add expense form */}
        <div className="lg:col-span-1">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Add transaction</CardTitle>
            </CardHeader>
            <CardContent>
              <ExpenseForm />
            </CardContent>
          </Card>

          {/* Category breakdown */}
          {categories.length > 0 && (
            <Card className="border-0 shadow-sm mt-4">
              <CardHeader>
                <CardTitle className="text-base">By category</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {categories.map(([cat, amount]) => (
                  <div key={cat} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      {CATEGORY_LABELS[cat] ?? cat}
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      €{amount.toFixed(2)}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Expense list */}
        <div className="lg:col-span-2">
          <ExpenseList expenses={(allExpenses ?? []) as Expense[]} />
        </div>
      </div>
    </div>
  );
}
