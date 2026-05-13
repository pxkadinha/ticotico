"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useTransition,
  type ReactNode,
} from "react";
import { translations, type Locale, type Translations } from "@/lib/i18n/translations";
import { setLocaleCookie } from "@/lib/i18n/actions";

interface LanguageContextValue {
  locale: Locale;
  t: typeof translations["en"];
  setLocale: (l: Locale) => void;
  isPending: boolean;
}

const LanguageContext = createContext<LanguageContextValue>({
  locale: "pt",
  t: translations.pt as unknown as typeof translations["en"],
  setLocale: () => {},
  isPending: false,
});

export function LanguageProvider({
  children,
  initialLocale,
}: {
  children: ReactNode;
  initialLocale: Locale;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const [isPending, startTransition] = useTransition();

  const t = translations[locale] as unknown as typeof translations["en"];

  function setLocale(next: Locale) {
    startTransition(async () => {
      await setLocaleCookie(next);
      setLocaleState(next);
    });
  }

  return (
    <LanguageContext.Provider value={{ locale, t, setLocale, isPending }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
