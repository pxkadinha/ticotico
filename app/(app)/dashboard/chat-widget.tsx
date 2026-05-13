"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import { format } from "date-fns";
import { Send, Loader2, MessageCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { sendMessage } from "@/app/(app)/chat/actions";
import { useLanguage } from "@/components/providers/language-provider";
import type { Message } from "@/types";

interface DashboardChatWidgetProps {
  initialMessages: Message[];
  familyId: string;
  currentUserId: string;
}

function formatTime(dateStr: string) {
  return format(new Date(dateStr), "HH:mm");
}

export function DashboardChatWidget({
  initialMessages,
  familyId,
  currentUserId,
}: DashboardChatWidgetProps) {
  const { t } = useLanguage();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [isPending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom whenever messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Realtime subscription
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`dashboard-chat-${familyId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `family_id=eq.${familyId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            // Keep only last 20 in the widget to avoid unbounded growth
            const updated = [...prev, newMsg];
            return updated.slice(-20);
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [familyId]);

  function handleSend() {
    const text = draft.trim();
    if (!text || isPending) return;
    setDraft("");
    startTransition(async () => {
      await sendMessage(text);
    });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-rose-500" />
            {t.chat.title}
          </CardTitle>
          <Link
            href="/chat"
            className="text-xs text-rose-500 hover:underline"
          >
            {t.chat.openChat} →
          </Link>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Messages area */}
        <div className="h-48 overflow-y-auto space-y-1 pr-1">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-sm text-muted-foreground">{t.chat.noMessages}</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.user_id === currentUserId;
              const displayName = msg.metadata?.display_name ?? "?";

              if (msg.type === "activity") {
                return (
                  <div key={msg.id} className="flex justify-center my-0.5">
                    <div className="flex items-center gap-1.5 bg-muted/50 rounded-full px-2.5 py-0.5 text-xs text-muted-foreground max-w-[95%]">
                      {msg.metadata?.icon && (
                        <span className="leading-none">{msg.metadata.icon}</span>
                      )}
                      <span className="truncate">{msg.content}</span>
                      <span className="text-muted-foreground/50 flex-shrink-0">
                        {formatTime(msg.created_at)}
                      </span>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={msg.id}
                  className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                >
                  <div className={`max-w-[75%] flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                    {!isMe && (
                      <span className="text-[10px] text-muted-foreground px-1 mb-0.5">
                        {displayName}
                      </span>
                    )}
                    <div
                      className={`rounded-2xl px-3 py-1.5 text-xs leading-relaxed ${
                        isMe
                          ? "bg-rose-500 text-white rounded-tr-sm"
                          : "bg-muted text-foreground rounded-tl-sm"
                      }`}
                    >
                      {msg.content}
                    </div>
                    <span className="text-[10px] text-muted-foreground/50 px-1 mt-0.5">
                      {formatTime(msg.created_at)}
                    </span>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input row */}
        <div className="flex gap-2">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t.chat.messagePlaceholder}
            className="h-9 text-sm"
            disabled={isPending}
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!draft.trim() || isPending}
            className="h-9 w-9 flex-shrink-0 bg-rose-500 hover:bg-rose-600 text-white"
          >
            {isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
