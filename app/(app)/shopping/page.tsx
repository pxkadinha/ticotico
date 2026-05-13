import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ShoppingCart } from "lucide-react";
import { NewListForm, ShoppingListCard } from "./shopping-list-client";
import type { ShoppingItem, ShoppingList } from "@/types";

export default async function ShoppingPage() {
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

  const { data: lists } = await supabase
    .from("shopping_lists")
    .select("*, shopping_items(*)")
    .eq("family_id", member.family_id)
    .order("created_at", { ascending: false });

  const allLists = (lists ?? []) as (ShoppingList & {
    shopping_items: ShoppingItem[];
  })[];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Shopping Lists</h1>
        <p className="text-gray-500 mt-1">
          Create lists and check off items together
        </p>
      </div>

      <NewListForm />

      {allLists.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <ShoppingCart className="w-12 h-12 mx-auto mb-4 text-gray-200" />
          <p>No lists yet. Create your first shopping list!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {allLists.map((list) => (
            <ShoppingListCard key={list.id} list={list} />
          ))}
        </div>
      )}
    </div>
  );
}
