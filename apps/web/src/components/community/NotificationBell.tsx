"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { KCButton, KCCard } from "@kashmir/ui";
import { getEmergencyClientSocket } from "@/lib/emergency/socket";

type NotificationItem = {
  id: string;
  title: string;
  body: string | null;
  read: boolean;
  createdAt: string;
};

export function NotificationBell(): JSX.Element {
  const [open, setOpen] = React.useState(false);
  const [items, setItems] = React.useState<NotificationItem[]>([]);
  const [unread, setUnread] = React.useState(0);
  const [userId, setUserId] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    const response = await fetch("/api/community/notifications");
    if (!response.ok) return;
    const data = (await response.json()) as { notifications: NotificationItem[]; unread: number; userId: string };
    setItems(data.notifications ?? []);
    setUnread(data.unread ?? 0);
    setUserId(data.userId ?? null);
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  React.useEffect(() => {
    if (!userId) return;
    const socket = getEmergencyClientSocket();
    socket.emit("join:user", userId);
    socket.on("notification:new", (notification: NotificationItem) => {
      setItems((prev) => [notification, ...prev]);
      setUnread((prev) => prev + 1);
    });
    return () => {
      socket.off("notification:new");
    };
  }, [userId]);

  const markAllRead = async () => {
    await fetch("/api/community/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "markAllRead" })
    });
    await load();
  };

  return (
    <div className="relative">
      <button
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#decdb6] bg-white dark:border-[#2a4160] dark:bg-[#13253d]"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Notifications"
      >
        🔔
        {unread > 0 ? (
          <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#C0392B] px-1 text-[10px] text-white">
            {unread}
          </span>
        ) : null}
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="absolute right-0 top-12 z-40 w-[340px]"
          >
            <KCCard className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Notifications</p>
                <KCButton size="sm" variant="ghost" onClick={markAllRead}>
                  Mark all read
                </KCButton>
              </div>
              <div className="max-h-[320px] space-y-2 overflow-y-auto">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className={`rounded-xl border p-2 text-xs ${item.read ? "border-[#e4d6c2]" : "border-[#C8972A]"} dark:border-[#2a4160]`}
                  >
                    <p className="font-semibold">{item.title}</p>
                    {item.body ? <p>{item.body}</p> : null}
                    <p className="text-[11px] text-[#7a6658] dark:text-[#96aac4]">
                      {new Date(item.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </KCCard>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
