"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { KCButton } from "@kashmir/ui";
import { DistrictFilter } from "@/components/community/DistrictFilter";
import { NotificationBell } from "@/components/community/NotificationBell";
import { PostCard } from "@/components/community/PostCard";
import { PostComposerModal } from "@/components/community/PostComposerModal";
import { getEmergencyClientSocket } from "@/lib/emergency/socket";

type PostData = {
  id: string;
  title: string;
  body: string;
  images: string[];
  district: string;
  tehsil: string | null;
  type: "ANNOUNCEMENT" | "EVENT" | "LOST_FOUND" | "VOLUNTEER" | "DISCUSSION";
  pinned: boolean;
  resolved: boolean;
  upvotes: number;
  createdAt: string;
  author: { email: string };
  event?: { rsvpCount: number } | null;
  lostFound?: { resolved: boolean } | null;
  volunteer?: { organization: string; skills: string[]; slots: number } | null;
};

const tabs = [
  { id: "ALL", label: "All" },
  { id: "ANNOUNCEMENT", label: "Announcements" },
  { id: "EVENT", label: "Events" },
  { id: "LOST_FOUND", label: "Lost & Found" },
  { id: "VOLUNTEER", label: "Volunteer" }
] as const;

type TabType = (typeof tabs)[number]["id"];

export default function CommunityPage(): JSX.Element {
  const [tab, setTab] = React.useState<TabType>("ALL");
  const [district, setDistrict] = React.useState("Srinagar");
  const [posts, setPosts] = React.useState<PostData[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showComposer, setShowComposer] = React.useState(false);
  const [newToast, setNewToast] = React.useState<string | null>(null);

  const loadPosts = React.useCallback(async () => {
    setLoading(true);
    const query = new URLSearchParams();
    if (district) query.set("district", district);
    if (tab !== "ALL") query.set("type", tab);
    const response = await fetch(`/api/community/posts?${query.toString()}`);
    const data = (await response.json()) as { posts: PostData[] };
    setPosts(data.posts ?? []);
    setLoading(false);
  }, [district, tab]);

  React.useEffect(() => {
    void loadPosts();
  }, [loadPosts]);

  React.useEffect(() => {
    const socket = getEmergencyClientSocket();
    socket.emit("join:district", district);
    socket.on("community:post:new", (post: PostData) => {
      setPosts((prev) => [post, ...prev]);
      setNewToast(`New post: ${post.title}`);
      window.setTimeout(() => setNewToast(null), 3000);
    });
    socket.on("community:post:upvote", (payload: { postId: string; upvotes: number }) => {
      setPosts((prev) => prev.map((post) => (post.id === payload.postId ? { ...post, upvotes: payload.upvotes } : post)));
    });
    socket.on("community:event:rsvp", (payload: { postId: string; rsvpCount: number }) => {
      setPosts((prev) =>
        prev.map((post) =>
          post.id === payload.postId && post.event
            ? { ...post, event: { ...post.event, rsvpCount: payload.rsvpCount } }
            : post
        )
      );
    });
    socket.on("community:post:resolved", (payload: { postId: string }) => {
      setPosts((prev) => prev.map((post) => (post.id === payload.postId ? { ...post, resolved: true } : post)));
    });
    return () => {
      socket.off("community:post:new");
      socket.off("community:post:upvote");
      socket.off("community:event:rsvp");
      socket.off("community:post:resolved");
    };
  }, [district]);

  const onUpvote = async (postId: string) => {
    setPosts((prev) => prev.map((post) => (post.id === postId ? { ...post, upvotes: post.upvotes + 1 } : post)));
    const response = await fetch(`/api/community/posts/${postId}/upvote`, { method: "POST" });
    if (!response.ok) {
      await loadPosts();
    } else {
      const data = (await response.json()) as { postId: string; upvotes: number };
      setPosts((prev) => prev.map((post) => (post.id === data.postId ? { ...post, upvotes: data.upvotes } : post)));
    }
  };

  const onRsvp = async (postId: string) => {
    await fetch(`/api/community/posts/${postId}/rsvp`, { method: "POST" });
  };

  const onResolve = async (postId: string) => {
    await fetch(`/api/community/posts/${postId}/resolve`, { method: "POST" });
  };

  const onNearMe = () => {
    navigator.geolocation.getCurrentPosition(
      () => {
        setDistrict("Srinagar");
      },
      () => undefined
    );
  };

  return (
    <main className="mx-auto max-w-7xl space-y-5 p-4 md:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-[#3D1F0D] dark:text-[#f3dfbb]">Community Hub</h1>
          <p className="text-sm text-[#6b5648] dark:text-[#bdd0e4]">
            District-first social feed for announcements, events, lost & found, and volunteer opportunities.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <KCButton onClick={() => setShowComposer(true)}>Create Post</KCButton>
          <NotificationBell />
        </div>
      </div>

      <DistrictFilter selectedDistrict={district} onSelectDistrict={setDistrict} onNearMe={onNearMe} />

      <div className="flex flex-wrap gap-2">
        {tabs.map((item) => (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            className={`rounded-full px-4 py-1.5 text-sm ${
              tab === item.id
                ? "bg-[#3D1F0D] text-[#FAF6EF] dark:bg-[#C8972A] dark:text-[#0e1624]"
                : "bg-[#efe3d1] text-[#3D1F0D] dark:bg-[#1b314a] dark:text-[#cfe1f6]"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <AnimatePresence>
        {newToast ? (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="rounded-xl border border-[#c49c52] bg-[#fff4dd] p-3 text-sm text-[#6e4a10] dark:border-[#8f722f] dark:bg-[#33280f] dark:text-[#f2dfa8]"
          >
            {newToast}
          </motion.div>
        ) : null}
      </AnimatePresence>

      <section className="space-y-3">
        {loading ? <p className="text-sm text-[#7a6658] dark:text-[#9db2ca]">Loading posts...</p> : null}
        {posts.map((post) => (
          <PostCard key={post.id} post={post} onUpvote={onUpvote} onRsvp={onRsvp} onResolve={onResolve} />
        ))}
        {!loading && posts.length === 0 ? (
          <p className="text-sm text-[#7a6658] dark:text-[#9db2ca]">No posts found for selected filters.</p>
        ) : null}
      </section>

      <PostComposerModal
        open={showComposer}
        onClose={() => setShowComposer(false)}
        onCreated={async () => {
          await loadPosts();
        }}
      />
    </main>
  );
}
