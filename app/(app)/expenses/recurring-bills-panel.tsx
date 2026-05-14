"use client";

import { useState, useTransition, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/components/providers/language-provider";
import { cn } from "@/lib/utils";
import type { RecurringBill, RecurringCadence } from "@/types";
import {
  addRecurringBill,
  deleteRecurringBill,
  markRecurringBillPaid,
  toggleRecurringBill,
  updateRecurringBill,
} from "./bills-actions";

const CATEGORY_COLORS: Record<string, string> = {
  food: "bg-orange-500/10 text-orange-600",
  health: "bg-blue-500/10 text-blue-600",
  home: "bg-muted text-muted-foreground",
  baby: "bg-pink-500/10 text-pink-600",
  transport: "bg-yellow-500/10 text-yellow-600",
  entertainment: "bg-purple-500/10 text-purple-600",
  other: "bg-muted text-muted-foreground",
};

function cadenceLabel(
  t: { expenses: { cadenceWeekly: string; cadenceMonthly: string; cadenceYearly: string } },
  c: RecurringCadence
) {
  if (c === "weekly") return t.expenses.cadenceWeekly;
  if (c === "monthly") return t.expenses.cadenceMonthly;
  return t.expenses.cadenceYearly;
}

function BillDialog({
  open,
  onOpenChange,
  bill,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  bill: RecurringBill | null;
}) {
  const { t } = useLanguage();
  const [isPending, startTransition] = useTransition();
  const isEdit = Boolean(bill);
  const [category, setCategory] = useState(bill?.category ?? "other");
  const [cadence, setCadence] = useState<RecurringCadence>(bill?.cadence ?? "monthly");

  useEffect(() => {
    if (!open) return;
    setCategory(bill?.category ?? "other");
    setCadence(bill?.cadence ?? "monthly");
  }, [open, bill]);

  const CATEGORIES = [
    { value: "food", label: t.expenses.categories.food },
    { value: "health", label: t.expenses.categories.health },
    { value: "home", label: t.expenses.categories.home },
    { value: "baby", label: t.expenses.categories.baby },
    { value: "transport", label: t.expenses.categories.transport },
    { value: "entertainment", label: t.expenses.categories.entertainment },
    { value: "other", label: t.expenses.categories.other },
  ] as const;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? t.expenses.editBill : t.expenses.addBill}</DialogTitle>
        </DialogHeader>
        <form
          key={bill?.id ?? "new"}
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            formData.set("category", category);
            formData.set("cadence", cadence);
            startTransition(async () => {
              try {
                if (isEdit && bill) {
                  await updateRecurringBill(bill.id, formData);
                  toast.success(t.expenses.billUpdated);
                } else {
                  await addRecurringBill(formData);
                  toast.success(t.expenses.billAdded);
                }
                onOpenChange(false);
              } catch (err) {
                toast.error((err as Error).message || t.expenses.couldNotSaveBill);
              }
            });
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="rb-title">{t.expenses.billTitle}</Label>
            <Input
              id="rb-title"
              name="title"
              defaultValue={bill?.title ?? ""}
              required
              maxLength={200}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rb-amount">{t.expenses.amount}</Label>
            <Input
              id="rb-amount"
              name="amount"
              type="number"
              step="0.01"
              min="0.01"
              defaultValue={bill ? String(bill.amount) : ""}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>{t.expenses.category}</Label>
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
            <Label>{t.expenses.cadenceLabel}</Label>
            <Select
              value={cadence}
              onValueChange={(v) => v && setCadence(v as RecurringCadence)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">{t.expenses.cadenceWeekly}</SelectItem>
                <SelectItem value="monthly">{t.expenses.cadenceMonthly}</SelectItem>
                <SelectItem value="yearly">{t.expenses.cadenceYearly}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="rb-next">{t.expenses.nextDue}</Label>
            <Input
              id="rb-next"
              name="next_due_date"
              type="date"
              defaultValue={bill?.next_due_date ?? format(new Date(), "yyyy-MM-dd")}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rb-rem">{t.expenses.reminderDays}</Label>
            <Input
              id="rb-rem"
              name="reminder_days_before"
              type="number"
              min={0}
              max={30}
              defaultValue={bill?.reminder_days_before ?? 1}
            />
            <p className="text-xs text-muted-foreground">{t.expenses.reminderDaysHint}</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="rb-notes">{t.expenses.notesOptional}</Label>
            <Textarea
              id="rb-notes"
              name="notes"
              rows={2}
              defaultValue={bill?.notes ?? ""}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t.expenses.cancel}
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : t.expenses.saveBill}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function RecurringBillsPanel({ bills }: { bills: RecurringBill[] }) {
  const { t } = useLanguage();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<RecurringBill | null>(null);
  const [isPending, startTransition] = useTransition();

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(b: RecurringBill) {
    setEditing(b);
    setDialogOpen(true);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">{t.expenses.tabRecurring}</p>
        <Button type="button" size="sm" onClick={openCreate}>
          <Plus className="w-4 h-4 mr-1" />
          {t.expenses.addBill}
        </Button>
      </div>

      <BillDialog
        key={editing?.id ?? "new"}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        bill={editing}
      />

      {bills.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            {t.expenses.noBills}
          </CardContent>
        </Card>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {bills.map((bill) => (
            <li key={bill.id}>
              <Card
                className={cn(
                  "h-full transition-opacity",
                  !bill.is_active && "opacity-60"
                )}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base font-semibold leading-tight pr-2">
                      {bill.title}
                    </CardTitle>
                    <Badge
                      variant="secondary"
                      className={cn("shrink-0 text-xs", CATEGORY_COLORS[bill.category])}
                    >
                      {t.expenses.categoryLabels[bill.category]}
                    </Badge>
                  </div>
                  <p className="text-lg font-semibold text-foreground">
                    €{Number(bill.amount).toFixed(2)}
                  </p>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground">
                    <span>
                      {t.expenses.nextDue}:{" "}
                      <span className="text-foreground font-medium">
                        {format(parseISO(`${bill.next_due_date}T12:00:00`), "MMM d, yyyy")}
                      </span>
                    </span>
                    <span>{cadenceLabel(t, bill.cadence)}</span>
                  </div>
                  {bill.notes ? (
                    <p className="text-xs text-muted-foreground line-clamp-2">{bill.notes}</p>
                  ) : null}
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                      <Checkbox
                        checked={bill.is_active}
                        disabled={isPending}
                        onCheckedChange={(checked) => {
                          startTransition(async () => {
                            try {
                              await toggleRecurringBill(bill.id, checked === true);
                            } catch (err) {
                              toast.error((err as Error).message);
                            }
                          });
                        }}
                      />
                      {t.expenses.activeLabel}
                    </label>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button
                      type="button"
                      size="sm"
                      variant="default"
                      disabled={!bill.is_active}
                      onClick={() => {
                        startTransition(async () => {
                          try {
                            await markRecurringBillPaid(bill.id);
                            toast.success(t.expenses.markPaidDone);
                          } catch (err) {
                            toast.error(
                              (err as Error).message || t.expenses.couldNotMarkPaid
                            );
                          }
                        });
                      }}
                    >
                      {t.expenses.markPaid}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => openEdit(bill)}
                    >
                      <Pencil className="w-3.5 h-3.5 mr-1" />
                      {t.expenses.editBill}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => {
                        if (!window.confirm(t.expenses.confirmDeleteBill)) return;
                        startTransition(async () => {
                          try {
                            await deleteRecurringBill(bill.id);
                            toast.success(t.expenses.billDeleted);
                          } catch {
                            toast.error(t.expenses.couldNotDeleteBill);
                          }
                        });
                      }}
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" />
                      {t.expenses.deleteBill}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
