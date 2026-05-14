"use client";

import { useState, useEffect, useRef, useTransition, useCallback } from "react";
import { format, isToday, isYesterday, isSameDay } from "date-fns";
import { Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { sendMessage } from "./actions";
import { useLanguage } from "@/components/providers/language-provider";
import { getDateFnsLocale } from "@/lib/i18n/date-locale";
import type { Message } from "@/types";
import type { Translations } from "@/lib/i18n/translations";

interface ChatClientProps {
  initialMessages: Message[];
  familyId: string;
  currentUserId: string;
}

function formatTime(dateStr: string) {
  return format(new Date(dateStr), "HH:mm");
}

function formatDateLabel(dateStr: string, t: Translations, locale: string) {
  const d = new Date(dateStr);
  if (isToday(d)) return t.calendar.today;
  if (isYesterday(d)) return t.common.yesterday;
  return format(d, "d MMMM yyyy", { locale: getDateFnsLocale(locale) });
}

function shouldShowDateSeparator(prev: Message | undefined, curr: Message) {
  if (!prev) return true;
  return !isSameDay(new Date(prev.created_at), new Date(curr.created_at));
}

export function ChatClient({ initialMessages, familyId, currentUserId }: ChatClientProps) {
  const { t, locale } = useLanguage();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [isPending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Realtime subscription
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`family-chat-${familyId}`)
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
            // Avoid duplicates (e.g. if optimistic update was done)
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [familyId]);

  const handleSend = useCallback(() => {
    const text = draft.trim();
    if (!text || isPending) return;
    setDraft("");
    textareaRef.current?.focus();
    startTransition(async () => {
      await sendMessage(text);
    });
  }, [draft, isPending]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex flex-col min-h-[calc(100dvh-10rem)] md:min-h-[calc(100dvh-6rem)]">
      {/* Messages */}
      <div className="flex-1 space-y-1 pb-4 px-2 sm:px-3">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-48">
            <p className="text-muted-foreground text-sm">{t.chat.noMessages}</p>
          </div>
        )}

        {messages.map((msg, i) => {
          const prev = messages[i - 1];
          const isMe = msg.user_id === currentUserId;
          const displayName = msg.metadata?.display_name ?? "?";
          const showDate = shouldShowDateSeparator(prev, msg);

          if (msg.type === "activity") {
            return (
              <div key={msg.id}>
                {showDate && (
                  <div className="flex items-center gap-3 my-4">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-xs text-muted-foreground font-medium">
                      {formatDateLabel(msg.created_at, t, locale)}
                    </span>
                    <div className="flex-1 h-px bg-border" />
                  </div>
                )}
                <div className="flex justify-center my-1 px-0.5">
                  <div className="flex items-center gap-1.5 bg-muted/50 rounded-full px-3 py-1 text-xs text-muted-foreground max-w-[min(75%,20rem)]">
                    {msg.metadata?.icon && (
                      <span className="text-sm leading-none">{msg.metadata.icon}</span>
                    )}
                    <span className="truncate">{msg.content}</span>
                    <span className="text-muted-foreground/50 flex-shrink-0">
                      {formatTime(msg.created_at)}
                    </span>
                  </div>
                </div>
              </div>
            );
          }

          // Regular text message
          const showName =
            !isMe &&
            (!prev || prev.user_id !== msg.user_id || shouldShowDateSeparator(prev, msg));

          return (
            <div key={msg.id}>
              {showDate && (
                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs text-muted-foreground font-medium">
                    {formatDateLabel(msg.created_at, t, locale)}
                  </span>
                  <div className="flex-1 h-px bg-border" />
                </div>
              )}
              <div className={`flex ${isMe ? "justify-end" : "justify-start"} px-0.5 sm:px-1 mb-0.5`}>
                <div className={`max-w-[75%] ${isMe ? "items-end" : "items-start"} flex flex-col`}>
                  {showName && (
                    <span className="text-xs text-muted-foreground px-1 mb-0.5">
                      {displayName}
                    </span>
                  )}
                  <div
                    className={`rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                      isMe
                        ? "bg-rose-500 text-white rounded-tr-sm"
                        : "bg-muted text-foreground rounded-tl-sm"
                    }`}
                  >
                    {msg.content}
                  </div>
                  <span className="text-[10px] text-muted-foreground/60 px-1 mt-0.5">
                    {formatTime(msg.created_at)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        <div ref={bottomRef} />
      </div>

      {/* Input area — sticky at the bottom */}
      <div className="sticky bottom-0 bg-background pt-3 pb-1 border-t border-border">
        <div className="flex gap-2 items-end">
          <Textarea
            ref={textareaRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t.chat.messagePlaceholder}
            rows={1}
            className="resize-none min-h-[2.5rem] max-h-32 flex-1"
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!draft.trim() || isPending}
            className="bg-rose-500 hover:bg-rose-600 text-white h-10 w-10 flex-shrink-0"
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground/40 mt-1">
          {t.chat.enterToSend}
        </p>
      </div>
    </div>
  );
}
