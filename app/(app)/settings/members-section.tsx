"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface Member {
  id: string;
  display_name: string | null;
  role: string;
  user_id: string;
  created_at: string;
}

export function MembersSection({
  members,
  currentUserId,
}: {
  members: Member[];
  currentUserId: string;
}) {
  if (members.length === 0) {
    return <p className="text-sm text-gray-400">No members yet.</p>;
  }

  return (
    <div className="space-y-3">
      {members.map((m) => {
        const name = m.display_name ?? "Unknown";
        const initials = name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2);
        const isYou = m.user_id === currentUserId;

        return (
          <div key={m.id} className="flex items-center gap-3">
            <Avatar className="w-9 h-9">
              <AvatarFallback className="bg-rose-100 text-rose-600 text-xs font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-gray-800">{name}</p>
                {isYou && (
                  <span className="text-xs text-gray-400">(you)</span>
                )}
              </div>
              <p className="text-xs text-gray-400">
                Joined {format(new Date(m.created_at), "MMM d, yyyy")}
              </p>
            </div>
            <Badge
              variant="secondary"
              className={`text-xs border-0 capitalize ${
                m.role === "admin"
                  ? "bg-rose-50 text-rose-600"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {m.role}
            </Badge>
          </div>
        );
      })}
    </div>
  );
}
