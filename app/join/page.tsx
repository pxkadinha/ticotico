import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { JoinClient } from "./join-client";

interface PageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function JoinPage({ searchParams }: PageProps) {
  const { token } = await searchParams;

  if (!token) {
    redirect("/login");
  }

  const supabase = await createClient();

  // Look up the family by invite token
  const { data: family } = await supabase
    .from("families")
    .select("id, name")
    .eq("invite_token", token)
    .maybeSingle();

  if (!family) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-orange-50 to-amber-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full text-center">
          <p className="text-4xl mb-4">🔗</p>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Invalid invite link
          </h2>
          <p className="text-gray-500 text-sm">
            This invite link is no longer valid or has already been used. Ask
            your partner to generate a new one from Settings.
          </p>
        </div>
      </div>
    );
  }

  // Check if already logged in
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    // Check if already a member of this family
    const { data: existing } = await supabase
      .from("family_members")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) {
      // Already in a family — just go to dashboard
      redirect("/dashboard");
    }

    // Logged in but no family — join directly
    const { data: memberData } = await supabase
      .from("family_members")
      .select("display_name")
      .eq("user_id", user.id)
      .maybeSingle();

    const displayName =
      memberData?.display_name ??
      user.user_metadata?.display_name ??
      user.email?.split("@")[0] ??
      "Partner";

    await supabase.from("family_members").insert({
      family_id: family.id,
      user_id: user.id,
      role: "member",
      display_name: displayName,
    });

    redirect("/dashboard");
  }

  // Not logged in — show register/login form pre-configured to join
  return (
    <JoinClient familyName={family.name} familyId={family.id} token={token} />
  );
}
