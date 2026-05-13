import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, Link2, LayoutGrid } from "lucide-react";
import { InviteSection } from "./invite-section";
import { MembersSection } from "./members-section";
import { ModulesSection } from "./modules-section";
import { getT } from "@/lib/i18n/server";
import { resolveModules } from "@/types";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: member } = await supabase
    .from("family_members").select("family_id, role, display_name").eq("user_id", user.id).single();
  if (!member) redirect("/setup");

  const t = await getT();

  const { data: family } = await supabase
    .from("families").select("id, name, invite_token, enabled_modules").eq("id", member.family_id).single();

  const { data: members } = await supabase
    .from("family_members").select("id, display_name, role, user_id, created_at")
    .eq("family_id", member.family_id).order("created_at", { ascending: true });

  return (
    <div className="max-w-2xl mx-auto space-y-8 pt-4 md:pt-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t.settings.title}</h1>
        <p className="text-muted-foreground mt-1">{family?.name}</p>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Link2 className="w-4 h-4 text-rose-500" />{t.settings.invitePartner}
          </CardTitle>
          <CardDescription>{t.settings.inviteDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <InviteSection familyId={family?.id ?? ""} inviteToken={family?.invite_token ?? ""} isAdmin={member.role === "admin"} />
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <LayoutGrid className="w-4 h-4 text-rose-500" />{t.settings.modules}
          </CardTitle>
          <CardDescription>{t.settings.modulesDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <ModulesSection initialModules={resolveModules(family?.enabled_modules)} />
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="w-4 h-4 text-rose-500" />{t.settings.familyMembers}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <MembersSection members={members ?? []} currentUserId={user.id} />
        </CardContent>
      </Card>
    </div>
  );
}
