import { pt as ptLocale } from "date-fns/locale";
import type { Locale } from "date-fns";

/**
 * Returns the date-fns locale object matching the current app locale,
 * or undefined (= English) for "en".
 */
export function getDateFnsLocale(locale: string): Locale | undefined {
  return locale === "pt" ? ptLocale : undefined;
}
