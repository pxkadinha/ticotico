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

  // No family yet — send them to the one-time setup page.
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
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden md:flex">
        <Sidebar
          userEmail={user.email}
          displayName={displayName}
          familyName={familyName}
        />
      </div>

      {/* Mobile header */}
      <MobileHeader
        userEmail={user.email}
        displayName={displayName}
        familyName={familyName}
      />

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="md:p-8 p-4 pb-24 md:pb-8">{children}</div>
      </main>

      <Toaster richColors position="top-right" />
    </div>
  );
}
