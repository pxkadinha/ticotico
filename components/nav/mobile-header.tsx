"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useLanguage } from "@/components/providers/language-provider";
import type { EnabledModules, ModuleId } from "@/types";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  DollarSign,
  CheckSquare,
  CalendarDays,
  MessageCircle,
  Heart,
  Menu,
  Sun,
  Moon,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Sidebar } from "./sidebar";
import { NotificationBell } from "./notification-bell";

interface MobileHeaderProps {
  userEmail?: string;
  displayName?: string;
  familyName?: string;
  familyId?: string;
  userId?: string;
  enabledModules?: EnabledModules;
}

export function MobileHeader({
  userEmail,
  displayName,
  familyName,
  familyId,
  userId,
  enabledModules,
}: MobileHeaderProps) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { t, locale, setLocale } = useLanguage();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const allBottomItems: { href: string; label: string; icon: React.ElementType; moduleId?: ModuleId }[] = [
    { href: "/dashboard", label: t.nav.dashboard, icon: LayoutDashboard },
    { href: "/expenses", label: t.nav.expenses, icon: DollarSign, moduleId: "expenses" },
    { href: "/tasks", label: t.nav.tasks, icon: CheckSquare, moduleId: "tasks" },
    { href: "/calendar", label: t.nav.calendar, icon: CalendarDays, moduleId: "calendar" },
    { href: "/chat", label: t.nav.chat, icon: MessageCircle, moduleId: "chat" },
  ];
  const bottomNavItems = allBottomItems.filter(
    ({ moduleId }) => !moduleId || !enabledModules || enabledModules[moduleId] !== false
  );

  return (
    <>
      {/* Top header — mobile only */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-card border-b border-border fixed top-0 left-0 right-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-rose-100 dark:bg-rose-900/40 rounded-lg flex items-center justify-center">
            <Heart className="w-4 h-4 text-rose-500" fill="currentColor" />
          </div>
          <span className="font-bold text-foreground text-sm">Family Hub</span>
        </div>
        <div className="flex items-center gap-1">
          {familyId && userId && (
            <NotificationBell familyId={familyId} userId={userId} />
          )}
          <Button
            variant="ghost"
            size="icon"
            className="w-8 h-8 text-xs font-semibold text-muted-foreground"
            onClick={() => setLocale(locale === "pt" ? "en" : "pt")}
          >
            {locale === "pt" ? "EN" : "PT"}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="w-9 h-9 text-muted-foreground"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {mounted && theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>
          <Sheet>
            <SheetTrigger
              render={
                <Button variant="ghost" size="icon" className="w-9 h-9" />
              }
            >
              <Menu className="w-5 h-5" />
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64">
              <Sidebar
                userEmail={userEmail}
                displayName={displayName}
                familyName={familyName}
                enabledModules={enabledModules}
                inSheet
              />
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Bottom tab bar — mobile only */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-40">
        <div className="flex">
          {bottomNavItems.map(({ href, label, icon: Icon }) => {
            const active =
              pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex-1 flex flex-col items-center gap-0.5 py-2 px-1 text-xs font-medium transition-colors",
                  active ? "text-rose-500 dark:text-rose-400" : "text-muted-foreground"
                )}
              >
                <Icon className="w-5 h-5" />
                <span>{label}</span>
              </Link>
            );
          })}
          <Sheet>
            <SheetTrigger className="flex-1 flex flex-col items-center gap-0.5 py-2 px-1 text-xs font-medium text-muted-foreground">
              <Menu className="w-5 h-5" />
              <span>{t.nav.more}</span>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64">
              <Sidebar
                userEmail={userEmail}
                displayName={displayName}
                familyName={familyName}
                enabledModules={enabledModules}
                inSheet
              />
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </>
  );
}
