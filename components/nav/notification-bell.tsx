"use client";

import { useState, useEffect, useRef, useCallback, useId } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/components/providers/language-provider";
import { format, isToday, isYesterday } from "date-fns";
import { getDateFnsLocale } from "@/lib/i18n/date-locale";
import type { Message } from "@/types";
import Link from "next/link";

interface NotificationBellProps {
  familyId: string;
  userId: string;
}

const STORAGE_KEY = "notif_last_seen";

function formatNotifTime(dateStr: string, locale: string) {
  const d = new Date(dateStr);
  const dateFnsLocale = getDateFnsLocale(locale);
  if (isToday(d)) return format(d, "HH:mm");
  if (isYesterday(d)) return format(d, "d MMM", { locale: dateFnsLocale });
  return format(d, "d MMM", { locale: dateFnsLocale });
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return new Uint8Array([...rawData].map((c) => c.charCodeAt(0)));
}

async function registerPush() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return;

  const reg = await navigator.serviceWorker.ready;
  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;

  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey),
    });
  }

  await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(sub.toJSON()),
  });
}

export function NotificationBell({ familyId, userId }: NotificationBellProps) {
  const { t, locale } = useLanguage();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [unread, setUnread] = useState(0);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [lastSeen, setLastSeen] = useState<string | null>(null);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>("default");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const channelRunRef = useRef(0);
  const instanceId = useId();

  const lastSeenKey = `${STORAGE_KEY}_${userId}`;

  const computeUnread = useCallback(
    (msgs: Message[]) => {
      const fromOthers = msgs.filter((m) => m.user_id !== userId);
      const ls = localStorage.getItem(lastSeenKey);
      if (!ls) return fromOthers.length;
      return fromOthers.filter((m) => new Date(m.created_at) > new Date(ls)).length;
    },
    [lastSeenKey, userId]
  );

  // Bootstrap browser-only values after mount
  useEffect(() => {
    setMounted(true);
    setLastSeen(localStorage.getItem(lastSeenKey));
    if ("Notification" in window) setNotifPermission(Notification.permission);
  }, [lastSeenKey]);

  // Check push status on mount
  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setPushEnabled(!!sub))
      .catch(() => {});
  }, []);

  // Load recent messages + set up Realtime
  useEffect(() => {
    const supabase = createClient();

    async function loadMessages() {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("family_id", familyId)
        .order("created_at", { ascending: false })
        .limit(30);

      const msgs = (data ?? []) as Message[];
      setMessages(msgs);
      setUnread(computeUnread(msgs));
    }

    loadMessages();

    channelRunRef.current += 1;
    const channel = supabase
      .channel(`notif-bell-${instanceId}-${channelRunRef.current}`)
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
            return [newMsg, ...prev].slice(0, 30);
          });
          // Only bump badge if sent by someone else
          if (newMsg.user_id !== userId) {
            setUnread((n) => n + 1);
            // Show in-app browser notification if the document is hidden
            if (document.hidden && Notification.permission === "granted") {
              const name = newMsg.metadata?.display_name ?? "Family Hub";
              const body =
                newMsg.type === "activity"
                  ? newMsg.content
                  : `${name}: ${newMsg.content}`;
              new Notification("Family Hub", { body, icon: "/icon-192.png" });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [familyId, userId, computeUnread, lastSeenKey]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleMarkAllRead(e: React.MouseEvent) {
    e.stopPropagation();
    const now = new Date().toISOString();
    localStorage.setItem(lastSeenKey, now);
    setLastSeen(now);
    setUnread(0);
  }

  function handleOpen() {
    setOpen((o) => !o);
    if (!open) {
      const now = new Date().toISOString();
      localStorage.setItem(lastSeenKey, now);
      setLastSeen(now);
      setUnread(0);
    }
  }

  async function handleEnablePush() {
    await registerPush();
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    setPushEnabled(!!sub);
    if ("Notification" in window) setNotifPermission(Notification.permission);
  }

  const notifLabel = mounted && unread > 0 ? `${unread > 9 ? "9+" : unread}` : null;

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="ghost"
        size="icon"
        className="relative w-9 h-9 text-muted-foreground hover:text-foreground"
        onClick={handleOpen}
        aria-label="Notifications"
      >
        <Bell className="w-4 h-4" />
        {notifLabel && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5 leading-none">
            {notifLabel}
          </span>
        )}
      </Button>

      {open && (
        <div className="fixed left-3 right-3 top-[60px] md:absolute md:left-0 md:right-auto md:top-full md:mt-2 md:w-80 bg-popover border border-border rounded-xl shadow-xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border gap-2">
            <p className="text-sm font-semibold text-foreground truncate">
              {t.nav.notifications ?? "Notifications"}
            </p>
            <div className="flex items-center gap-2 flex-shrink-0">
              {mounted && unread > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="text-xs text-muted-foreground hover:text-foreground font-medium"
                >
                  {t.nav.markAllRead}
                </button>
              )}
              {mounted && !pushEnabled && notifPermission !== "denied" && (
                <button
                  onClick={handleEnablePush}
                  className="text-xs text-rose-500 hover:text-rose-600 font-medium"
                >
                  {t.nav.enablePush ?? "Enable push"}
                </button>
              )}
            </div>
          </div>

          {/* Message list */}
          <div className="max-h-[50vh] md:max-h-80 overflow-y-auto divide-y divide-border">
            {messages.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                {t.chat.noMessages}
              </p>
            ) : messages.every(
                (m) => m.type === "activity" && m.user_id === userId
              ) ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                {t.chat.noMessages}
              </p>
            ) : (
              messages
                .filter((msg) => !(msg.type === "activity" && msg.user_id === userId))
                .map((msg) => {
                const isActivity = msg.type === "activity";
                const isOwn = msg.user_id === userId;
                const name = msg.metadata?.display_name ?? "?";
                const isNew =
                  !isOwn &&
                  (!lastSeen || new Date(msg.created_at) > new Date(lastSeen));

                return (
                  <div
                    key={msg.id}
                    className={`flex gap-3 px-4 py-3 hover:bg-muted/50 transition-colors ${isNew ? "bg-rose-500/5" : ""}`}
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {isActivity ? (
                        <span className="text-base leading-none">
                          {msg.metadata?.icon ?? "📌"}
                        </span>
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-rose-500/10 flex items-center justify-center text-xs font-semibold text-rose-500">
                          {name.slice(0, 1).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      {isActivity ? (
                        // Activity: content is already descriptive ("Miguel added task X")
                        <p className="text-sm text-foreground leading-snug line-clamp-2">
                          {msg.content}
                        </p>
                      ) : (
                        // Chat: show "[Name] sent a message in Chat" + preview
                        <>
                          <p className="text-sm font-medium text-foreground leading-snug">
                            {isOwn ? "You" : name}
                            <span className="font-normal text-muted-foreground"> · Chat</span>
                          </p>
                          <p className="text-xs text-foreground/70 line-clamp-1 mt-0.5">
                            {msg.content}
                          </p>
                        </>
                      )}
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {formatNotifTime(msg.created_at, locale)}
                      </p>
                    </div>
                    {isNew && (
                      <span className="w-2 h-2 rounded-full bg-rose-500 flex-shrink-0 mt-1.5" />
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-border px-4 py-2.5">
            <Link
              href="/chat"
              onClick={() => setOpen(false)}
              className="text-xs text-rose-500 hover:text-rose-600 font-medium"
            >
              {t.chat.openChat} →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
