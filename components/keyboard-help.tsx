"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLanguage } from "@/components/providers/language-provider";

function isTypingTarget(el: EventTarget | null) {
  if (!el || !(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  return el.isContentEditable;
}

export function KeyboardHelp() {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) return;
      if (e.key === "?" || (e.shiftKey && e.key === "/")) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    },
    []
  );

  useEffect(() => {
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onKeyDown]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{t.common.keyboardHelp}</DialogTitle>
        </DialogHeader>
        <ul className="text-sm text-muted-foreground space-y-2 mt-2 list-disc pl-4">
          <li>
            <kbd className="px-1.5 py-0.5 rounded border border-border bg-muted text-foreground font-mono text-xs">?</kbd>{" "}
            — {t.common.shortcutHelp}
          </li>
          <li>{t.common.shortcutNav}</li>
        </ul>
        <p className="text-xs text-muted-foreground mt-3">{t.common.pressQuestionMark}</p>
      </DialogContent>
    </Dialog>
  );
}
