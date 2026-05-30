"use client";

import * as React from "react";
import { io, Socket } from "socket.io-client";
import { KCCard, KCSkeleton } from "@kashmir/ui";

type FeedEventType = "storefront_view" | "order" | "signup" | "sos_alert";
type FeedEvent = {
  id: string;
  type: FeedEventType;
  label: string;
  at: string;
};

const typeColor: Record<FeedEventType, string> = {
  storefront_view: "bg-[#1B6CA8]/15 text-[#1B6CA8]",
  order: "bg-[#3D1F0D]/15 text-[#3D1F0D] dark:text-[#f2dfbb]",
  signup: "bg-[#2f7d45]/15 text-[#2f7d45]",
  sos_alert: "bg-[#C0392B]/15 text-[#C0392B]"
};

export function LiveFeed(): JSX.Element {
  const [loading, setLoading] = React.useState(true);
  const [paused, setPaused] = React.useState(false);
  const [filter, setFilter] = React.useState<FeedEventType | "all">("all");
  const [events, setEvents] = React.useState<FeedEvent[]>([]);
  const socketRef = React.useRef<Socket | null>(null);

  React.useEffect(() => {
    const socket = io({
      path: "/api/socket.io",
      transports: ["websocket", "polling"]
    });
    socketRef.current = socket;
    socket.emit("join-room", "analytics-feed");
    socket.on("analytics:event", (payload: FeedEvent) => {
      if (paused) return;
      setEvents((prev) => [payload, ...prev].slice(0, 50));
    });

    const timer = setTimeout(() => setLoading(false), 450);
    return () => {
      clearTimeout(timer);
      socket.disconnect();
    };
  }, [paused]);

  const visibleEvents = filter === "all" ? events : events.filter((event) => event.type === filter);

  return (
    <KCCard className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-[#3D1F0D] dark:text-[#f2dfbb]">Real-time Events Feed</h3>
        <div className="flex gap-2">
          <select className="h-9 rounded-md border px-2 text-xs dark:bg-[#102239]" value={filter} onChange={(e) => setFilter(e.target.value as FeedEventType | "all")}>
            <option value="all">All events</option>
            <option value="storefront_view">Storefront views</option>
            <option value="order">Orders</option>
            <option value="signup">Signups</option>
            <option value="sos_alert">SOS alerts</option>
          </select>
          <button className="rounded-md border px-3 py-1 text-xs" onClick={() => setPaused((p) => !p)}>
            {paused ? "Resume" : "Pause"}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          <KCSkeleton className="h-12 w-full rounded-md" />
          <KCSkeleton className="h-12 w-full rounded-md" />
          <KCSkeleton className="h-12 w-full rounded-md" />
        </div>
      ) : (
        <div className="max-h-[320px] space-y-2 overflow-y-auto pr-1">
          {visibleEvents.length === 0 ? (
            <p className="text-sm text-[#6f5a4d] dark:text-[#9cb5ce]">Waiting for incoming analytics events...</p>
          ) : (
            visibleEvents.map((event) => (
              <div key={event.id} className="flex items-center justify-between rounded-lg border border-[#e8dbc8] bg-[#fffaf3] px-3 py-2 dark:border-[#24405e] dark:bg-[#102239]">
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${typeColor[event.type]}`}>{event.type.replace("_", " ")}</span>
                  <p className="text-sm">{event.label}</p>
                </div>
                <span className="text-xs text-[#7b6856] dark:text-[#a8bfd8]">{new Date(event.at).toLocaleTimeString()}</span>
              </div>
            ))
          )}
        </div>
      )}
    </KCCard>
  );
}
