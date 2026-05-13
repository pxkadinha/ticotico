"use client";

import React, { useState, useMemo, useEffect } from "react";
import { format, getDaysInMonth, getDate, startOfMonth, eachDayOfInterval, endOfMonth } from "date-fns";
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Wallet, Settings, Download, X, Check } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ExpenseList } from "./expense-list";
import type { Expense, ExpenseCategory } from "@/types";
import { useLanguage } from "@/components/providers/language-provider";

const CATEGORY_COLORS: Record<string, string> = {
  food: "#f97316",
  health: "#3b82f6",
  home: "#8b5cf6",
  baby: "#ec4899",
  transport: "#eab308",
  entertainment: "#06b6d4",
  other: "#6b7280",
};

const PIE_COLORS = Object.values(CATEGORY_COLORS);

type FamilyMember = { user_id: string; display_name: string | null };

interface Props {
  yearExpenses: Expense[];
  familyMembers: FamilyMember[];
  currentUserId: string;
  familyId: string;
  serverDate: string;
  children: React.ReactNode;
}

function pct(value: number, prev: number): number | null {
  if (prev === 0) return null;
  return Math.round(((value - prev) / prev) * 100);
}

function DeltaBadge({ value, inverse = false }: { value: number | null; inverse?: boolean }) {
  if (value === null) return null;
  const positive = inverse ? value < 0 : value > 0;
  return (
    <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${
      positive ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-500"
    }`}>
      {value > 0 ? "+" : ""}{value}%
    </span>
  );
}

export function ExpensesAnalytics({ yearExpenses, familyMembers, currentUserId, familyId, serverDate, children }: Props) {
  const { t } = useLanguage();
  // Use the server-computed date so server and client render identical HTML on hydration
  const now = useMemo(() => new Date(serverDate), [serverDate]);
  const currentYear = now.getFullYear();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth()); // 0-indexed
  const [showBudgetPanel, setShowBudgetPanel] = useState(false);
  const [budgets, setBudgets] = useState<Record<string, number>>({});
  const [budgetDraft, setBudgetDraft] = useState<Record<string, string>>({});

  // Load budgets from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(`budgets_${familyId}`);
      if (stored) setBudgets(JSON.parse(stored));
    } catch {}
  }, [familyId]);

  function saveBudgets() {
    const parsed: Record<string, number> = {};
    Object.entries(budgetDraft).forEach(([k, v]) => {
      const n = parseFloat(v);
      if (!isNaN(n) && n > 0) parsed[k] = n;
    });
    const merged = { ...budgets, ...parsed };
    setBudgets(merged);
    try { localStorage.setItem(`budgets_${familyId}`, JSON.stringify(merged)); } catch {}
    setShowBudgetPanel(false);
  }

  const categories: ExpenseCategory[] = ["food", "health", "home", "baby", "transport", "entertainment", "other"];

  // Helper: filter expenses for a given month (0-indexed)
  function expensesFor(month: number) {
    return yearExpenses.filter((e) => {
      const d = new Date(e.date);
      return d.getMonth() === month && d.getFullYear() === currentYear;
    });
  }

  const monthExpenses = useMemo(() => expensesFor(selectedMonth), [yearExpenses, selectedMonth]);
  const prevMonthExpenses = useMemo(() => expensesFor(selectedMonth === 0 ? 11 : selectedMonth - 1), [yearExpenses, selectedMonth]);

  const income = useMemo(() => monthExpenses.filter((e) => e.type === "income").reduce((s, e) => s + Number(e.amount), 0), [monthExpenses]);
  const expenses = useMemo(() => monthExpenses.filter((e) => e.type === "expense").reduce((s, e) => s + Number(e.amount), 0), [monthExpenses]);
  const balance = income - expenses;
  const savingsRate = income > 0 ? Math.round(((income - expenses) / income) * 100) : null;

  const prevIncome = useMemo(() => prevMonthExpenses.filter((e) => e.type === "income").reduce((s, e) => s + Number(e.amount), 0), [prevMonthExpenses]);
  const prevExpenses = useMemo(() => prevMonthExpenses.filter((e) => e.type === "expense").reduce((s, e) => s + Number(e.amount), 0), [prevMonthExpenses]);
  const prevBalance = prevIncome - prevExpenses;

  // Insights
  const today = now.getDate();
  const daysInMonth = getDaysInMonth(new Date(currentYear, selectedMonth, 1));
  const daysElapsed = selectedMonth === now.getMonth() ? today : daysInMonth;
  const avgDaily = daysElapsed > 0 ? expenses / daysElapsed : 0;
  const forecast = selectedMonth === now.getMonth() ? avgDaily * daysInMonth : expenses;

  const biggestExpense = useMemo(() => {
    const only = monthExpenses.filter((e) => e.type === "expense");
    if (!only.length) return null;
    return only.reduce((max, e) => Number(e.amount) > Number(max.amount) ? e : max, only[0]);
  }, [monthExpenses]);

  // Year bar chart data
  const yearChartData = useMemo(() => t.expenses.months.map((name, i) => {
    const m = expensesFor(i);
    return {
      name,
      income: m.filter((e) => e.type === "income").reduce((s, e) => s + Number(e.amount), 0),
      expenses: m.filter((e) => e.type === "expense").reduce((s, e) => s + Number(e.amount), 0),
    };
  }), [yearExpenses, t]);

  // Category donut
  const categoryData = useMemo(() => {
    const map: Record<string, number> = {};
    monthExpenses.filter((e) => e.type === "expense").forEach((e) => {
      map[e.category] = (map[e.category] ?? 0) + Number(e.amount);
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .map(([cat, value]) => ({
        name: t.expenses.categoryLabels[cat as keyof typeof t.expenses.categoryLabels] ?? cat,
        value,
        cat,
        color: CATEGORY_COLORS[cat] ?? "#6b7280",
      }));
  }, [monthExpenses, t]);

  // Cumulative spend
  const cumulativeData = useMemo(() => {
    const monthStart = startOfMonth(new Date(currentYear, selectedMonth));
    const monthEnd = endOfMonth(new Date(currentYear, selectedMonth));
    const clampedEnd = selectedMonth === now.getMonth() ? now : monthEnd;
    const days = eachDayOfInterval({ start: monthStart, end: clampedEnd });
    let running = 0;
    return days.map((d) => {
      const dayStr = format(d, "yyyy-MM-dd");
      const dayTotal = monthExpenses
        .filter((e) => e.type === "expense" && e.date === dayStr)
        .reduce((s, e) => s + Number(e.amount), 0);
      running += dayTotal;
      return { day: format(d, "d"), total: parseFloat(running.toFixed(2)) };
    });
  }, [monthExpenses, selectedMonth, currentYear]);

  // By person
  const byPerson = useMemo(() => familyMembers.map((m) => {
    const total = monthExpenses.filter((e) => e.type === "expense" && e.user_id === m.user_id).reduce((s, e) => s + Number(e.amount), 0);
    return { name: m.display_name ?? "?", total };
  }).filter((x) => x.total > 0), [monthExpenses, familyMembers]);

  const maxPersonTotal = byPerson.reduce((m, x) => Math.max(m, x.total), 0);

  // CSV export
  function exportCSV() {
    const rows = [
      ["Date", "Type", "Category", "Amount", "Description"],
      ...yearExpenses.map((e) => [e.date, e.type, e.category, e.amount, e.description ?? ""]),
    ];
    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `expenses-${currentYear}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const monthLabel = `${t.expenses.months[selectedMonth]} ${currentYear}`;

  return (
    <div className="space-y-6">
      {/* Month Navigator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => setSelectedMonth((m) => Math.max(0, m - 1))} disabled={selectedMonth === 0}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-base font-semibold text-foreground w-32 text-center">{monthLabel}</span>
          <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => setSelectedMonth((m) => Math.min(now.getMonth(), m + 1))} disabled={selectedMonth >= now.getMonth()}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={exportCSV}>
          <Download className="w-3.5 h-3.5" />
          {t.expenses.exportCSV}
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              </div>
              <span className="text-xs text-muted-foreground">{t.expenses.income}</span>
            </div>
            <p className="text-xl font-bold text-emerald-600">€{income.toFixed(2)}</p>
            <div className="mt-1"><DeltaBadge value={pct(income, prevIncome)} /></div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 bg-red-500/10 rounded-lg flex items-center justify-center">
                <TrendingDown className="w-3.5 h-3.5 text-red-500" />
              </div>
              <span className="text-xs text-muted-foreground">{t.expenses.expensesLabel}</span>
            </div>
            <p className="text-xl font-bold text-red-500">€{expenses.toFixed(2)}</p>
            <div className="mt-1"><DeltaBadge value={pct(expenses, prevExpenses)} inverse /></div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${balance >= 0 ? "bg-blue-500/10" : "bg-orange-500/10"}`}>
                <Wallet className={`w-3.5 h-3.5 ${balance >= 0 ? "text-blue-500" : "text-orange-500"}`} />
              </div>
              <span className="text-xs text-muted-foreground">{t.expenses.balance}</span>
            </div>
            <p className={`text-xl font-bold ${balance >= 0 ? "text-blue-500" : "text-orange-500"}`}>
              {balance >= 0 ? "+" : ""}€{balance.toFixed(2)}
            </p>
            <div className="mt-1"><DeltaBadge value={pct(balance, prevBalance)} /></div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 bg-violet-500/10 rounded-lg flex items-center justify-center">
                <span className="text-xs font-bold text-violet-500">%</span>
              </div>
              <span className="text-xs text-muted-foreground">{t.expenses.savingsRate}</span>
            </div>
            {savingsRate !== null ? (
              <>
                <p className={`text-xl font-bold ${savingsRate >= 0 ? "text-violet-600" : "text-red-500"}`}>{savingsRate}%</p>
                <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${savingsRate >= 20 ? "bg-emerald-500" : savingsRate >= 0 ? "bg-amber-500" : "bg-red-500"}`}
                    style={{ width: `${Math.min(100, Math.max(0, savingsRate))}%` }}
                  />
                </div>
              </>
            ) : (
              <p className="text-xl font-bold text-muted-foreground">—</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Insights Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="border-0 shadow-sm bg-muted/30">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">{t.expenses.avgDailySpend}</p>
            <p className="text-lg font-bold text-foreground">€{avgDaily.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{daysElapsed}d elapsed</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-muted/30">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">{t.expenses.biggestExpense}</p>
            {biggestExpense ? (
              <>
                <p className="text-lg font-bold text-red-500">€{Number(biggestExpense.amount).toFixed(2)}</p>
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {biggestExpense.description || t.expenses.categoryLabels[biggestExpense.category as keyof typeof t.expenses.categoryLabels]}
                </p>
              </>
            ) : (
              <p className="text-lg font-bold text-muted-foreground">—</p>
            )}
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-muted/30">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">{t.expenses.forecast}</p>
            <p className="text-lg font-bold text-foreground">€{forecast.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{daysInMonth - daysElapsed}d remaining</p>
          </CardContent>
        </Card>
      </div>

      {/* Year Bar Chart */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t.expenses.yearOverview} {currentYear}</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={yearChartData} barGap={2} barCategoryGap="30%"
              onClick={(data) => {
                if (data?.activeTooltipIndex != null) {
                  setSelectedMonth(Math.min(data.activeTooltipIndex as number, now.getMonth()));
                }
              }}
            >
              <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `€${v}`} />
              <Tooltip formatter={(v: unknown) => `€${(v as number).toFixed(2)}`} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="income" name={t.expenses.income} fill="#10b981" radius={[3, 3, 0, 0]}
                fillOpacity={0.85}
              />
              <Bar dataKey="expenses" name={t.expenses.expensesLabel} fill="#ef4444" radius={[3, 3, 0, 0]}
                fillOpacity={0.85}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Donut + Cumulative */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category donut + budgets */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{t.expenses.byCategory}</CardTitle>
              <Button variant="ghost" size="icon" className="w-7 h-7 text-muted-foreground" onClick={() => {
                setBudgetDraft(Object.fromEntries(Object.entries(budgets).map(([k, v]) => [k, String(v)])));
                setShowBudgetPanel(!showBudgetPanel);
              }}>
                {showBudgetPanel ? <X className="w-4 h-4" /> : <Settings className="w-4 h-4" />}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {showBudgetPanel ? (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">{t.expenses.budgetLimit} (€/month)</p>
                {categories.map((cat) => (
                  <div key={cat} className="flex items-center gap-2">
                    <span className="text-sm text-foreground flex-1">
                      {t.expenses.categoryLabels[cat as keyof typeof t.expenses.categoryLabels]}
                    </span>
                    <Input
                      type="number"
                      min="0"
                      step="10"
                      placeholder="—"
                      className="w-24 h-7 text-xs"
                      value={budgetDraft[cat] ?? budgets[cat] ?? ""}
                      onChange={(e) => setBudgetDraft((d) => ({ ...d, [cat]: e.target.value }))}
                    />
                  </div>
                ))}
                <Button size="sm" className="w-full gap-1.5 mt-2" onClick={saveBudgets}>
                  <Check className="w-3.5 h-3.5" />
                  {t.expenses.saveChanges}
                </Button>
              </div>
            ) : categoryData.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">{t.expenses.noData}</div>
            ) : (
              <div className="space-y-4">
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={categoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value">
                      {categoryData.map((entry, i) => (
                        <Cell key={entry.cat} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: unknown) => `€${(v as number).toFixed(2)}`} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2">
                  {categoryData.map((entry) => {
                    const limit = budgets[entry.cat];
                    const pctUsed = limit ? Math.min(100, (entry.value / limit) * 100) : null;
                    return (
                      <div key={entry.cat}>
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
                            <span className="text-muted-foreground">{entry.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground">€{entry.value.toFixed(2)}</span>
                            {limit && <span className="text-xs text-muted-foreground">/ €{limit}</span>}
                          </div>
                        </div>
                        {pctUsed !== null && (
                          <div className="mt-1 h-1 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${pctUsed >= 100 ? "bg-red-500" : pctUsed >= 80 ? "bg-amber-500" : "bg-emerald-500"}`}
                              style={{ width: `${pctUsed}%` }}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cumulative spend line */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t.expenses.cumulativeSpend}</CardTitle>
          </CardHeader>
          <CardContent>
            {cumulativeData.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">{t.expenses.noData}</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={cumulativeData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `€${v}`} />
                  <Tooltip formatter={(v: unknown) => [`€${(v as number).toFixed(2)}`, t.expenses.cumulativeSpend]} />
                  <Line type="monotone" dataKey="total" stroke="#ef4444" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* By person */}
      {byPerson.length > 1 && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t.expenses.byPerson}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {byPerson.map((p) => (
              <div key={p.name}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-foreground font-medium">{p.name}</span>
                  <span className="text-muted-foreground">€{p.total.toFixed(2)}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-rose-500 rounded-full"
                    style={{ width: maxPersonTotal > 0 ? `${(p.total / maxPersonTotal) * 100}%` : "0%" }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Add form + transaction list */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card className="border-0 shadow-sm">
            <CardHeader><CardTitle className="text-base">{t.expenses.addTransaction}</CardTitle></CardHeader>
            <CardContent>{children}</CardContent>
          </Card>
        </div>
        <div className="lg:col-span-2">
          <ExpenseList expenses={monthExpenses} />
        </div>
      </div>
    </div>
  );
}
