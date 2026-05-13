"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useLanguage } from "@/components/providers/language-provider";

interface Member {
  id: string;
  display_name: string | null;
  role: string;
  user_id: string;
  created_at: string;
}

export function MembersSection({ members, currentUserId }: { members: Member[]; currentUserId: string }) {
  const { t } = useLanguage();

  if (members.length === 0) {
    return <p className="text-sm text-muted-foreground">{t.settings.noMembers}</p>;
  }

  return (
    <div className="space-y-3">
      {members.map((m) => {
        const name = m.display_name ?? "Unknown";
        const initials = name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
        const isYou = m.user_id === currentUserId;

        return (
          <div key={m.id} className="flex items-center gap-3">
            <Avatar className="w-9 h-9">
              <AvatarFallback className="bg-rose-500/10 text-rose-500 text-xs font-semibold">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-foreground">{name}</p>
                {isYou && <span className="text-xs text-muted-foreground">{t.settings.you}</span>}
              </div>
              <p className="text-xs text-muted-foreground">
                {t.settings.joined} {format(new Date(m.created_at), "d MMM yyyy")}
              </p>
            </div>
            <Badge variant="secondary" className={`text-xs border-0 capitalize ${m.role === "admin" ? "bg-rose-500/10 text-rose-500" : "bg-muted text-muted-foreground"}`}>
              {m.role}
            </Badge>
          </div>
        );
      })}
    </div>
  );
}
