import {
  addMonths,
  addWeeks,
  addYears,
  format,
  parseISO,
} from "date-fns";
import type { RecurringCadence } from "@/types";

export function advanceNextDueDate(ymd: string, cadence: RecurringCadence): string {
  const d = parseISO(`${ymd}T12:00:00`);
  const next =
    cadence === "weekly"
      ? addWeeks(d, 1)
      : cadence === "monthly"
        ? addMonths(d, 1)
        : addYears(d, 1);
  return format(next, "yyyy-MM-dd");
}
