"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Check, RefreshCw, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { regenerateInviteToken } from "./actions";

interface InviteSectionProps {
  familyId: string;
  inviteToken: string;
  isAdmin: boolean;
}

export function InviteSection({ familyId, inviteToken, isAdmin }: InviteSectionProps) {
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const inviteUrl = `${baseUrl}/join?token=${inviteToken}`;

  function handleCopy() {
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    toast.success("Invite link copied!");
    setTimeout(() => setCopied(false), 2000);
  }

  function handleRegenerate() {
    startTransition(async () => {
      try {
        await regenerateInviteToken(familyId);
        toast.success("New invite link generated");
      } catch {
        toast.error("Could not regenerate link");
      }
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          value={inviteUrl}
          readOnly
          className="font-mono text-xs text-gray-500 bg-gray-50"
        />
        <Button
          variant="outline"
          size="icon"
          onClick={handleCopy}
          className="flex-shrink-0"
        >
          {copied ? (
            <Check className="w-4 h-4 text-emerald-500" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
        </Button>
      </div>

      {isAdmin && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRegenerate}
          disabled={isPending}
          className="text-gray-500 hover:text-gray-700 px-0"
        >
          {isPending ? (
            <Loader2 className="w-3 h-3 animate-spin mr-1.5" />
          ) : (
            <RefreshCw className="w-3 h-3 mr-1.5" />
          )}
          Generate new link
        </Button>
      )}

      <p className="text-xs text-gray-400">
        Send this link to your partner. They&apos;ll create an account (or log in)
        and be added to your family automatically.
      </p>
    </div>
  );
}
