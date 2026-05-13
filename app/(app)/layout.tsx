import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/nav/sidebar";
import { MobileHeader } from "@/components/nav/mobile-header";
import { resolveModules } from "@/types";
import { KeyboardHelp } from "@/components/keyboard-help";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: member } = await supabase
    .from("family_members")
    .select("display_name, family_id, families(name, enabled_modules)")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!member) {
    redirect("/setup");
  }

  const displayName =
    member?.display_name ??
    user.user_metadata?.display_name ??
    user.email?.split("@")[0];

  const familyData = member?.families as { name?: string; enabled_modules?: unknown } | null;
  const familyName = familyData?.name ?? undefined;
  const enabledModules = resolveModules(familyData?.enabled_modules);

  return (
    <div className="flex h-dvh bg-background overflow-hidden">
      {/* Desktop sidebar — hidden on mobile */}
      <div className="hidden md:flex md:flex-shrink-0">
        <Sidebar
          userEmail={user.email}
          displayName={displayName}
          familyName={familyName}
          familyId={member.family_id}
          userId={user.id}
          enabledModules={enabledModules}
        />
      </div>

      {/* Mobile header (top bar + bottom tabs) — hidden on desktop */}
      <MobileHeader
        userEmail={user.email}
        displayName={displayName}
        familyName={familyName}
        familyId={member.family_id}
        userId={user.id}
        enabledModules={enabledModules}
      />

      {/* Main content */}
      <main className="flex-1 overflow-y-auto w-full min-w-0">
        <div className="p-4 pt-16 pb-24 md:pt-0 md:pb-8 md:p-8">
          {children}
        </div>
      </main>

      <KeyboardHelp />
    </div>
  );
}
