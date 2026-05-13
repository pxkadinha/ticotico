"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/providers/language-provider";

export function AppearanceSection() {
  const { theme, setTheme } = useTheme();
  const { t, locale, setLocale } = useLanguage();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="flex flex-wrap gap-3">
      <Button
        variant="outline"
        size="sm"
        className="gap-2"
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      >
        {mounted && theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        {mounted && theme === "dark" ? t.nav.lightMode : t.nav.darkMode}
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="font-semibold min-w-[3rem]"
        onClick={() => setLocale(locale === "pt" ? "en" : "pt")}
      >
        {locale === "pt" ? "EN" : "PT"}
      </Button>
    </div>
  );
}
