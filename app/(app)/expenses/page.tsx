import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ExpenseForm } from "./expense-form";
import { ExpensesAnalytics } from "./expenses-analytics";
import type { Expense } from "@/types";
import { getT } from "@/lib/i18n/server";

export default async function ExpensesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: member } = await supabase
    .from("family_members").select("family_id, user_id").eq("user_id", user.id).single();
  if (!member) redirect("/dashboard");

  const t = await getT();
  const serverNow = new Date();
  const year = serverNow.getFullYear();

  const [{ data: yearExpenses }, { data: familyMembers }] = await Promise.all([
    supabase
      .from("expenses")
      .select("*")
      .eq("family_id", member.family_id)
      .gte("date", `${year}-01-01`)
      .lte("date", `${year}-12-31`)
      .order("date", { ascending: false }),
    supabase
      .from("family_members")
      .select("user_id, display_name")
      .eq("family_id", member.family_id),
  ]);

  return (
    <div className="max-w-5xl mx-auto space-y-8 pt-4 md:pt-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t.expenses.title}</h1>
      </div>

      <ExpensesAnalytics
        yearExpenses={(yearExpenses ?? []) as Expense[]}
        familyMembers={(familyMembers ?? []) as { user_id: string; display_name: string | null }[]}
        currentUserId={user.id}
        familyId={member.family_id}
        serverDate={serverNow.toISOString()}
      >
        <ExpenseForm />
      </ExpensesAnalytics>
    </div>
  );
}
