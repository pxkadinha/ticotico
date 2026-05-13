import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ShoppingCart } from "lucide-react";
import { NewListForm, ShoppingListCard } from "./shopping-list-client";
import type { ShoppingItem, ShoppingList } from "@/types";
import { getT } from "@/lib/i18n/server";

export default async function ShoppingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: member } = await supabase
    .from("family_members").select("family_id").eq("user_id", user.id).single();
  if (!member) redirect("/dashboard");

  const t = await getT();

  const { data: lists } = await supabase
    .from("shopping_lists").select("*, shopping_items(*)")
    .eq("family_id", member.family_id).order("created_at", { ascending: false });

  const allLists = (lists ?? []) as (ShoppingList & { shopping_items: ShoppingItem[] })[];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t.shopping.title}</h1>
        <p className="text-muted-foreground mt-1">{t.shopping.subtitle}</p>
      </div>
      <NewListForm />
      {allLists.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p>{t.shopping.noLists}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {allLists.map((list) => <ShoppingListCard key={list.id} list={list} />)}
        </div>
      )}
    </div>
  );
}
