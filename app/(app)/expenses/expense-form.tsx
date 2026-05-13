"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
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
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { addExpense } from "./actions";

const CATEGORIES = [
  { value: "food", label: "Food & Groceries" },
  { value: "health", label: "Health & Medical" },
  { value: "home", label: "Home & Utilities" },
  { value: "baby", label: "Baby" },
  { value: "transport", label: "Transport" },
  { value: "entertainment", label: "Entertainment" },
  { value: "other", label: "Other" },
];

export function ExpenseForm() {
  const [isPending, startTransition] = useTransition();
  const [type, setType] = useState("expense");
  const [category, setCategory] = useState("other");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set("type", type);
    formData.set("category", category);

    startTransition(async () => {
      try {
        await addExpense(formData);
        toast.success("Transaction added");
        (e.target as HTMLFormElement).reset();
      } catch (err) {
        toast.error((err as Error).message);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Type toggle */}
      <div className="flex rounded-lg border border-gray-200 p-1 gap-1">
        {["expense", "income"].map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            className={`flex-1 py-1.5 rounded-md text-sm font-medium capitalize transition-all ${
              type === t
                ? t === "expense"
                  ? "bg-red-500 text-white"
                  : "bg-emerald-500 text-white"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        <Label htmlFor="amount">Amount (€)</Label>
        <Input
          id="amount"
          name="amount"
          type="number"
          step="0.01"
          min="0.01"
          placeholder="0.00"
          required
        />
      </div>

      <div className="space-y-2">
        <Label>Category</Label>
        <Select value={category} onValueChange={(v) => v && setCategory(v)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          name="description"
          placeholder="Optional note"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="date">Date</Label>
        <Input
          id="date"
          name="date"
          type="date"
          defaultValue={format(new Date(), "yyyy-MM-dd")}
          required
        />
      </div>

      <Button
        type="submit"
        disabled={isPending}
        className="w-full bg-rose-500 hover:bg-rose-600 text-white"
      >
        {isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
        Add transaction
      </Button>
    </form>
  );
}
