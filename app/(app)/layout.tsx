import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/nav/sidebar";
import { MobileHeader } from "@/components/nav/mobile-header";
import { Toaster } from "@/components/ui/sonner";

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
    .select("display_name, family_id, families(name)")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!member) {
    redirect("/setup");
  }

  const displayName =
    member?.display_name ??
    user.user_metadata?.display_name ??
    user.email?.split("@")[0];

  const familyName =
    (member?.families as { name?: string } | null)?.name ?? undefined;

  return (
    <div className="flex h-dvh bg-gray-50 overflow-hidden">
      {/* Desktop sidebar — hidden on mobile */}
      <div className="hidden md:flex md:flex-shrink-0">
        <Sidebar
          userEmail={user.email}
          displayName={displayName}
          familyName={familyName}
        />
      </div>

      {/* Mobile header (top bar + bottom tabs) — hidden on desktop */}
      <MobileHeader
        userEmail={user.email}
        displayName={displayName}
        familyName={familyName}
      />

      {/* Main content */}
      <main className="flex-1 overflow-y-auto w-full min-w-0">
        <div className="p-4 pt-16 pb-24 md:pt-0 md:pb-8 md:p-8">
          {children}
        </div>
      </main>

      <Toaster richColors position="top-right" />
    </div>
  );
}
