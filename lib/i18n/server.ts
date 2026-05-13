import { cookies } from "next/headers";
import { translations, type Locale } from "./translations";

export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const value = store.get("locale")?.value;
  return value === "en" || value === "pt" ? value : "pt";
}

export async function getT() {
  const locale = await getLocale();
  return translations[locale];
}
