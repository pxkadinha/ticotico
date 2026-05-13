"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
  Menu,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Sidebar } from "./sidebar";

const bottomNavItems = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/expenses", label: "Expenses", icon: DollarSign },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/baby", label: "Baby", icon: Baby },
];

interface MobileHeaderProps {
  userEmail?: string;
  displayName?: string;
  familyName?: string;
}

export function MobileHeader({
  userEmail,
  displayName,
  familyName,
}: MobileHeaderProps) {
  const pathname = usePathname();

  const pageTitle = pathname.replace("/", "").replace(/^./, (s) =>
    s.toUpperCase()
  );

  return (
    <>
      {/* Top header for mobile */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100 fixed top-0 left-0 right-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-rose-100 rounded-lg flex items-center justify-center">
            <Heart className="w-4 h-4 text-rose-500" fill="currentColor" />
          </div>
          <span className="font-bold text-gray-900 text-sm">
            {pageTitle || "Family Hub"}
          </span>
        </div>
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
            />
          </SheetContent>
        </Sheet>
      </header>

      {/* Bottom tab bar for mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-40 safe-area-bottom">
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
                  active ? "text-rose-500" : "text-gray-400"
                )}
              >
                <Icon className="w-5 h-5" />
                <span>{label}</span>
              </Link>
            );
          })}
          {/* More sheet trigger */}
          <Sheet>
            <SheetTrigger className="flex-1 flex flex-col items-center gap-0.5 py-2 px-1 text-xs font-medium text-gray-400">
              <Menu className="w-5 h-5" />
              <span>More</span>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64">
              <Sidebar
                userEmail={userEmail}
                displayName={displayName}
                familyName={familyName}
              />
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </>
  );
}
