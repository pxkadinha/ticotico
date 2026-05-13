"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  DollarSign,
  CheckSquare,
  CalendarDays,
  Baby,
  ShoppingCart,
  FileText,
  Heart,
  LogOut,
  ChevronRight,
  Settings,
  Sun,
  Moon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/expenses", label: "Expenses", icon: DollarSign },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/baby", label: "Baby", icon: Baby },
  { href: "/shopping", label: "Shopping", icon: ShoppingCart },
  { href: "/notes", label: "Notes", icon: FileText },
  { href: "/settings", label: "Settings", icon: Settings },
];

interface SidebarProps {
  userEmail?: string;
  displayName?: string;
  familyName?: string;
}

export function Sidebar({ userEmail, displayName, familyName }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
    router.push("/login");
  }

  const initials = displayName
    ? displayName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : userEmail?.slice(0, 2).toUpperCase() ?? "?";

  return (
    <aside className="w-64 bg-card border-r border-border flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-border">
        <div className="w-9 h-9 bg-rose-100 dark:bg-rose-900/40 rounded-xl flex items-center justify-center flex-shrink-0">
          <Heart className="w-5 h-5 text-rose-500" fill="currentColor" />
        </div>
        <div className="min-w-0">
          <p className="font-bold text-foreground text-sm leading-tight">
            Family Hub
          </p>
          {familyName && (
            <p className="text-xs text-muted-foreground truncate">{familyName}</p>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active =
            pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group",
                active
                  ? "bg-rose-500/10 text-rose-500 dark:bg-rose-500/15 dark:text-rose-400"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon
                className={cn(
                  "w-4 h-4 flex-shrink-0 transition-colors",
                  active
                    ? "text-rose-500 dark:text-rose-400"
                    : "text-muted-foreground group-hover:text-foreground"
                )}
              />
              {label}
              {active && (
                <ChevronRight className="w-3 h-3 ml-auto text-rose-400" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User + controls */}
      <div className="px-3 py-4 border-t border-border space-y-1">
        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground px-3"
        >
          {theme === "dark" ? (
            <Sun className="w-4 h-4" />
          ) : (
            <Moon className="w-4 h-4" />
          )}
          {theme === "dark" ? "Light mode" : "Dark mode"}
        </Button>

        <div className="flex items-center gap-3 px-3 py-2 rounded-xl">
          <Avatar className="w-8 h-8 flex-shrink-0">
            <AvatarFallback className="bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 text-xs font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground truncate">
              {displayName ?? "You"}
            </p>
            <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleSignOut}
          className="w-full justify-start gap-3 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 px-3"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </Button>
      </div>
    </aside>
  );
}
