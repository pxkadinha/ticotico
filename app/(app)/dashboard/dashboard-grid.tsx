"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
  useSortable,
  arrayMove,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { format } from "date-fns";
import {
  CheckSquare,
  CalendarDays,
  Baby,
  ShoppingCart,
  FileText,
  DollarSign,
  Clock,
  GripVertical,
  AlertCircle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/components/providers/language-provider";
import type { Task, Appointment, BabyLog, ShoppingList, Note } from "@/types";

const WIDGET_IDS = ["tasks", "appointments", "baby", "shopping", "notes", "balance"] as const;
type WidgetId = (typeof WIDGET_IDS)[number];

interface DashboardGridProps {
  familyId: string;
  tasks: Task[];
  appointments: Appointment[];
  babyLogs: BabyLog[];
  shoppingLists: (ShoppingList & { shopping_items: { checked: boolean }[] })[];
  notes: Note[];
  totalIncome: number;
  totalExpenses: number;
  balance: number;
}

// ── Sortable wrapper ─────────────────────────────────────────────────────────

function SortableCard({ id, children }: { id: string; children: React.ReactNode }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={`relative group ${isDragging ? "z-50 opacity-60 scale-[1.02]" : ""}`}
    >
      {/* Drag handle — visible on hover, absolutely positioned over card */}
      <button
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        aria-label="Drag to reorder"
        className="absolute top-3.5 right-3 z-10 p-1 rounded opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-opacity touch-none"
        // Prevent the button click from navigating if the card is inside a Link
        onPointerDown={(e) => e.stopPropagation()}
      >
        <GripVertical className="w-4 h-4" />
      </button>
      {children}
    </div>
  );
}

// ── Individual card components ────────────────────────────────────────────────

type T = ReturnType<typeof useLanguage>["t"];

function formatAppointmentDate(dateStr: string) {
  return format(new Date(dateStr), "d MMM, HH:mm");
}

function CardHeader2({ icon, title, href, viewAll }: { icon: React.ReactNode; title: string; href: string; viewAll: string }) {
  return (
    <CardHeader className="pb-3">
      <div className="flex items-center justify-between pr-6">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
        <Link href={href} className="text-xs text-rose-500 hover:underline">
          {viewAll}
        </Link>
      </div>
    </CardHeader>
  );
}

function TasksWidget({ tasks, t }: { tasks: Task[]; t: T }) {
  return (
    <Card className="border-0 shadow-sm h-full">
      <CardHeader2 icon={<CheckSquare className="w-4 h-4 text-blue-500" />} title={t.dashboard.tasksCard} href="/tasks" viewAll={t.dashboard.viewAll} />
      <CardContent className="space-y-2">
        {tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">{t.dashboard.allDone}</p>
        ) : (
          tasks.slice(0, 4).map((task) => (
            <div key={task.id} className="flex items-start gap-2 py-1.5 border-b border-border last:border-0">
              <span className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${task.priority === "high" ? "bg-red-400" : task.priority === "medium" ? "bg-amber-400" : "bg-muted-foreground"}`} />
              <div className="min-w-0">
                <p className="text-sm text-foreground truncate">{task.title}</p>
                {task.due_date && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3" />
                    {format(new Date(task.due_date), "MMM d")}
                  </p>
                )}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function AppointmentsWidget({ appointments, t }: { appointments: Appointment[]; t: T }) {
  return (
    <Card className="border-0 shadow-sm h-full">
      <CardHeader2 icon={<CalendarDays className="w-4 h-4 text-purple-500" />} title={t.dashboard.upcomingCard} href="/calendar" viewAll={t.dashboard.viewAll} />
      <CardContent className="space-y-2">
        {appointments.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">{t.dashboard.noUpcoming}</p>
        ) : (
          appointments.slice(0, 4).map((appt) => (
            <div key={appt.id} className="flex items-start gap-3 py-1.5 border-b border-border last:border-0">
              <div className="w-8 h-8 bg-purple-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <CalendarDays className="w-4 h-4 text-purple-500" />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-foreground truncate font-medium">{appt.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{formatAppointmentDate(appt.start_time)}</p>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function BabyWidget({ babyLogs, t }: { babyLogs: BabyLog[]; t: T }) {
  return (
    <Card className="border-0 shadow-sm h-full">
      <CardHeader2 icon={<Baby className="w-4 h-4 text-pink-500" />} title={t.dashboard.babyCard} href="/baby" viewAll={t.dashboard.viewAll} />
      <CardContent className="space-y-2">
        {babyLogs.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">{t.dashboard.noLogs}</p>
        ) : (
          babyLogs.map((log) => (
            <div key={log.id} className="flex items-center gap-3 py-1.5 border-b border-border last:border-0">
              <Badge variant="secondary" className="text-xs capitalize bg-pink-500/10 text-pink-500 border-0">
                {(t.baby as Record<string, string>)[log.type] ?? log.type}
              </Badge>
              <p className="text-xs text-muted-foreground ml-auto">{format(new Date(log.timestamp), "HH:mm")}</p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function ShoppingWidget({ shoppingLists, t }: { shoppingLists: (ShoppingList & { shopping_items: { checked: boolean }[] })[]; t: T }) {
  return (
    <Card className="border-0 shadow-sm h-full">
      <CardHeader2 icon={<ShoppingCart className="w-4 h-4 text-orange-500" />} title={t.dashboard.shoppingCard} href="/shopping" viewAll={t.dashboard.viewAll} />
      <CardContent className="space-y-2">
        {shoppingLists.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">{t.dashboard.noLists}</p>
        ) : (
          shoppingLists.map((list) => {
            const items = list.shopping_items ?? [];
            const done = items.filter((i) => i.checked).length;
            return (
              <div key={list.id} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                <p className="text-sm text-foreground">{list.title}</p>
                <span className="text-xs text-muted-foreground">{done}/{items.length}</span>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

function NotesWidget({ notes, t }: { notes: Note[]; t: T }) {
  return (
    <Card className="border-0 shadow-sm h-full">
      <CardHeader2 icon={<FileText className="w-4 h-4 text-teal-500" />} title={t.dashboard.notesCard} href="/notes" viewAll={t.dashboard.viewAll} />
      <CardContent className="space-y-2">
        {notes.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">{t.dashboard.noNotes}</p>
        ) : (
          notes.map((note) => (
            <div key={note.id} className="py-1.5 border-b border-border last:border-0">
              <p className="text-sm text-foreground font-medium truncate">{note.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{format(new Date(note.updated_at), "MMM d")}</p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function BalanceWidget({ balance, t }: { balance: number; t: T }) {
  return (
    <Card className="border-0 shadow-sm h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between pr-6">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <DollarSign className={`w-4 h-4 ${balance >= 0 ? "text-emerald-500" : "text-red-500"}`} />
            {t.dashboard.monthlyBalance}
          </CardTitle>
          <Link href="/expenses" className="text-xs text-rose-500 hover:underline">
            {t.dashboard.viewAll}
          </Link>
        </div>
        <CardDescription>{t.dashboard.thisMonth}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className={`text-3xl font-bold ${balance >= 0 ? "text-emerald-500" : "text-red-500"}`}>
          {balance >= 0 ? "+" : ""}€{balance.toFixed(2)}
        </p>
        {balance < 0 && (
          <div className="flex items-center gap-1 mt-2 text-red-500 text-xs">
            <AlertCircle className="w-3 h-3" />
            {t.dashboard.exceedsIncome}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Main sortable grid ────────────────────────────────────────────────────────

export function DashboardGrid({
  familyId,
  tasks,
  appointments,
  babyLogs,
  shoppingLists,
  notes,
  totalIncome,
  totalExpenses,
  balance,
}: DashboardGridProps) {
  const { t } = useLanguage();
  const storageKey = `dashboard-order-${familyId}`;
  const [order, setOrder] = useState<WidgetId[]>([...WIDGET_IDS]);

  // Load persisted order from localStorage after mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed: WidgetId[] = JSON.parse(raw);
        // Only apply if it contains exactly the expected IDs
        const isValid =
          parsed.length === WIDGET_IDS.length &&
          WIDGET_IDS.every((id) => parsed.includes(id));
        if (isValid) setOrder(parsed);
      }
    } catch {
      // ignore
    }
  }, [storageKey]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      // Require 8px of movement so normal clicks still work
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setOrder((prev) => {
      const next = arrayMove(
        prev,
        prev.indexOf(active.id as WidgetId),
        prev.indexOf(over.id as WidgetId)
      );
      localStorage.setItem(storageKey, JSON.stringify(next));
      return next;
    });
  }

  const widgetMap: Record<WidgetId, React.ReactNode> = {
    tasks: <TasksWidget tasks={tasks} t={t} />,
    appointments: <AppointmentsWidget appointments={appointments} t={t} />,
    baby: <BabyWidget babyLogs={babyLogs} t={t} />,
    shopping: <ShoppingWidget shoppingLists={shoppingLists as (ShoppingList & { shopping_items: { checked: boolean }[] })[]} t={t} />,
    notes: <NotesWidget notes={notes} t={t} />,
    balance: <BalanceWidget balance={balance} t={t} />,
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={order} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {order.map((id) => (
            <SortableCard key={id} id={id}>
              {widgetMap[id]}
            </SortableCard>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
