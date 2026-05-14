export type FamilyRole = "admin" | "member";

export const ALL_MODULE_IDS = ["expenses", "tasks", "calendar", "chat", "baby", "shopping", "notes"] as const;
export type ModuleId = (typeof ALL_MODULE_IDS)[number];
export type EnabledModules = Record<ModuleId, boolean>;

export const DEFAULT_MODULES: EnabledModules = {
  expenses: true, tasks: true, calendar: true, chat: true,
  baby: true, shopping: true, notes: true,
};

export function resolveModules(raw: unknown): EnabledModules {
  const base = { ...DEFAULT_MODULES };
  if (raw && typeof raw === "object") {
    for (const key of ALL_MODULE_IDS) {
      if (key in (raw as Record<string, unknown>)) {
        base[key] = Boolean((raw as Record<string, unknown>)[key]);
      }
    }
  }
  return base;
}

export interface Family {
  id: string;
  name: string;
  enabled_modules: EnabledModules | null;
  created_at: string;
}

export interface FamilyMember {
  id: string;
  family_id: string;
  user_id: string;
  role: FamilyRole;
  display_name: string | null;
  created_at: string;
}

export type ExpenseType = "income" | "expense";
export type ExpenseCategory =
  | "food"
  | "health"
  | "home"
  | "baby"
  | "transport"
  | "entertainment"
  | "other";

export type RecurringCadence = "weekly" | "monthly" | "yearly";

export interface RecurringBill {
  id: string;
  family_id: string;
  created_by: string;
  title: string;
  amount: number;
  category: ExpenseCategory;
  cadence: RecurringCadence;
  next_due_date: string;
  reminder_days_before: number;
  is_active: boolean;
  reminder_sent_for_due: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Expense {
  id: string;
  family_id: string;
  user_id: string;
  amount: number;
  type: ExpenseType;
  category: ExpenseCategory;
  description: string | null;
  date: string;
  created_at: string;
}

export type TaskStatus = "pending" | "in_progress" | "done";
export type TaskPriority = "low" | "medium" | "high";
export type TaskRecurrence = "none" | "daily" | "weekly" | "monthly";

export interface Task {
  id: string;
  family_id: string;
  created_by: string;
  assigned_to: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  recurrence: TaskRecurrence;
  created_at: string;
}

export interface Appointment {
  id: string;
  family_id: string;
  created_by: string;
  title: string;
  description: string | null;
  location: string | null;
  start_time: string;
  end_time: string | null;
  all_day: boolean;
  created_at: string;
}

export type BabyLogType = "feed" | "sleep" | "diaper" | "milestone";

export interface BabyLog {
  id: string;
  family_id: string;
  logged_by: string;
  type: BabyLogType;
  timestamp: string;
  duration_minutes: number | null;
  notes: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface ShoppingList {
  id: string;
  family_id: string;
  created_by: string;
  title: string;
  created_at: string;
  items?: ShoppingItem[];
}

export interface ShoppingItem {
  id: string;
  list_id: string;
  name: string;
  quantity: string | null;
  checked: boolean;
  added_by: string | null;
  created_at: string;
}

export interface Message {
  id: string;
  family_id: string;
  user_id: string | null;
  content: string;
  type: "text" | "activity";
  metadata: {
    icon?: string;
    action?: string;
    display_name?: string;
  } | null;
  created_at: string;
}

export interface Note {
  id: string;
  family_id: string;
  created_by: string;
  title: string;
  content: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
}
