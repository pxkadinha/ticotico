"use client";

import { useState, useTransition, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Check, RefreshCw, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { regenerateInviteToken } from "./actions";
import { useLanguage } from "@/components/providers/language-provider";

interface InviteSectionProps {
  familyId: string;
  inviteToken: string;
  isAdmin: boolean;
}

export function InviteSection({ familyId, inviteToken, isAdmin }: InviteSectionProps) {
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [inviteUrl, setInviteUrl] = useState(`/join?token=${inviteToken}`);
  const { t } = useLanguage();

  useEffect(() => {
    setInviteUrl(`${window.location.origin}/join?token=${inviteToken}`);
  }, [inviteToken]);

  function handleCopy() {
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    toast.success(t.settings.copied);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleRegenerate() {
    startTransition(async () => {
      try {
        await regenerateInviteToken(familyId);
        toast.success(t.settings.newLinkGenerated);
      } catch { toast.error(t.settings.couldNotRegenerate); }
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input value={inviteUrl} readOnly className="font-mono text-xs text-muted-foreground bg-muted" />
        <Button variant="outline" size="icon" onClick={handleCopy} className="flex-shrink-0">
          {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
        </Button>
      </div>
      {isAdmin && (
        <Button variant="ghost" size="sm" onClick={handleRegenerate} disabled={isPending} className="text-muted-foreground hover:text-foreground px-0">
          {isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1.5" /> : <RefreshCw className="w-3 h-3 mr-1.5" />}
          {t.settings.generateNewLink}
        </Button>
      )}
      <p className="text-xs text-muted-foreground">{t.settings.inviteInfo}</p>
    </div>
  );
}
