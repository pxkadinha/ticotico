import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { NotesGrid } from "./notes-client";
import type { Note } from "@/types";
import { getT } from "@/lib/i18n/server";

export default async function NotesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: member } = await supabase
    .from("family_members").select("family_id").eq("user_id", user.id).single();
  if (!member) redirect("/dashboard");

  const t = await getT();

  const { data: notes } = await supabase
    .from("notes").select("*").eq("family_id", member.family_id)
    .order("updated_at", { ascending: false });

  return (
    <div className="max-w-5xl mx-auto space-y-8 pt-4 md:pt-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t.notes.title}</h1>
        <p className="text-muted-foreground mt-1">{t.notes.count(notes?.length ?? 0)}</p>
      </div>
      <NotesGrid notes={(notes ?? []) as Note[]} />
    </div>
  );
}
