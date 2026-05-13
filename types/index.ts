export type FamilyRole = "admin" | "member";

export interface Family {
  id: string;
  name: string;
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
