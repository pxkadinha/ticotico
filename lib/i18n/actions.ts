"use server";

import { cookies } from "next/headers";
import type { Locale } from "./translations";

export async function setLocaleCookie(locale: Locale) {
  const store = await cookies();
  store.set("locale", locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1 year
    sameSite: "lax",
  });
}
