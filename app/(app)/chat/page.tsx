import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ChatClient } from "./chat-client";
import { getT } from "@/lib/i18n/server";
import type { Message } from "@/types";

export default async function ChatPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: member } = await supabase
    .from("family_members")
    .select("family_id, display_name")
    .eq("user_id", user.id)
    .single();
  if (!member) redirect("/dashboard");

  const t = await getT();

  // Load last 100 messages
  const { data: messages } = await supabase
    .from("messages")
    .select("*")
    .eq("family_id", member.family_id)
    .order("created_at", { ascending: true })
    .limit(100);

  return (
    <div className="max-w-3xl mx-auto pt-4 md:pt-6">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-foreground">{t.chat.title}</h1>
        <p className="text-muted-foreground mt-1">{t.chat.subtitle}</p>
      </div>

      <ChatClient
        initialMessages={(messages ?? []) as Message[]}
        familyId={member.family_id}
        currentUserId={user.id}
      />
    </div>
  );
}
