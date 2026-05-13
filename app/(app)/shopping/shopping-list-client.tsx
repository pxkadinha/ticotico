"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, Loader2, Plus, ShoppingCart, X } from "lucide-react";
import { toast } from "sonner";
import { createShoppingList, addShoppingItem, toggleShoppingItem, deleteShoppingItem, deleteShoppingList } from "./actions";
import type { ShoppingList, ShoppingItem } from "@/types";
import { useLanguage } from "@/components/providers/language-provider";

function ShoppingItemRow({ item, listId }: { item: ShoppingItem; listId: string }) {
  const [isPending, startTransition] = useTransition();
  const { t } = useLanguage();

  return (
    <div className={`flex items-center gap-3 py-2.5 border-b border-border last:border-0 group ${isPending ? "opacity-50" : ""}`}>
      {isPending ? (
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground flex-shrink-0" />
      ) : (
        <Checkbox
          checked={item.checked}
          onCheckedChange={(v) => startTransition(async () => {
            try { await toggleShoppingItem(item.id, !!v); }
            catch { toast.error(t.shopping.couldNotUpdate); }
          })}
          className="border-border data-[state=checked]:bg-rose-500 data-[state=checked]:border-rose-500"
        />
      )}
      <span className={`flex-1 text-sm ${item.checked ? "line-through text-muted-foreground" : "text-foreground"}`}>
        {item.name}
        {item.quantity && <span className="text-muted-foreground ml-1">({item.quantity})</span>}
      </span>
      <Button
        variant="ghost" size="icon"
        className="w-6 h-6 text-muted-foreground/50 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={() => startTransition(async () => {
          try { await deleteShoppingItem(item.id); }
          catch { toast.error(t.shopping.couldNotDelete); }
        })}
      >
        <X className="w-3 h-3" />
      </Button>
    </div>
  );
}

function AddItemForm({ listId }: { listId: string }) {
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const { t } = useLanguage();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    startTransition(async () => {
      try {
        await addShoppingItem(listId, name.trim(), quantity.trim());
        setName(""); setQuantity("");
      } catch { toast.error(t.shopping.couldNotAdd); }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 mt-3">
      <Input placeholder={t.shopping.itemPlaceholder} value={name} onChange={(e) => setName(e.target.value)} className="flex-1 h-8 text-sm" required />
      <Input placeholder={t.shopping.qty} value={quantity} onChange={(e) => setQuantity(e.target.value)} className="w-20 h-8 text-sm" />
      <Button type="submit" size="icon" className="h-8 w-8 bg-rose-500 hover:bg-rose-600" disabled={isPending}>
        {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
      </Button>
    </form>
  );
}

export function ShoppingListCard({ list }: { list: ShoppingList & { shopping_items: ShoppingItem[] } }) {
  const [deleting, startDelete] = useTransition();
  const { t } = useLanguage();
  const items = list.shopping_items ?? [];
  const done = items.filter((i) => i.checked).length;

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-orange-500" />{list.title}
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">{t.shopping.done(done, items.length)}</p>
          </div>
          <Button
            variant="ghost" size="icon"
            className="w-7 h-7 text-muted-foreground/50 hover:text-red-400 hover:bg-red-500/10"
            disabled={deleting}
            onClick={() => startDelete(async () => {
              try { await deleteShoppingList(list.id); toast.success(t.shopping.listDeleted); }
              catch { toast.error(t.shopping.couldNotDelete); }
            })}
          >
            {deleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">{t.shopping.noItems}</p>
        ) : (
          <div className="divide-y divide-border">
            {items.sort((a, b) => Number(a.checked) - Number(b.checked)).map((item) => (
              <ShoppingItemRow key={item.id} item={item} listId={list.id} />
            ))}
          </div>
        )}
        <AddItemForm listId={list.id} />
      </CardContent>
    </Card>
  );
}

export function NewListForm() {
  const [isPending, startTransition] = useTransition();
  const { t } = useLanguage();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await createShoppingList(formData);
        toast.success(t.shopping.listCreated);
        (e.target as HTMLFormElement).reset();
      } catch (err) { toast.error((err as Error).message); }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input name="title" placeholder={t.shopping.newListPlaceholder} required className="flex-1" />
      <Button type="submit" disabled={isPending} className="bg-rose-500 hover:bg-rose-600 text-white">
        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
      </Button>
    </form>
  );
}
