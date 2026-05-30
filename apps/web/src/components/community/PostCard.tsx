"use client";

import { motion } from "framer-motion";
import { formatDistanceToNowStrict } from "date-fns";
import { KCBadge, KCButton, KCCard } from "@kashmir/ui";

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

function typeBadge(type: PostData["type"]): "featured" | "verified" | "pending" | "sector" {
  if (type === "ANNOUNCEMENT") return "featured";
  if (type === "EVENT") return "verified";
  if (type === "LOST_FOUND") return "pending";
  return "sector";
}

export function PostCard({
  post,
  onUpvote,
  onRsvp,
  onResolve
}: {
  post: PostData;
  onUpvote: (postId: string) => void;
  onRsvp: (postId: string) => void;
  onResolve: (postId: string) => void;
}): JSX.Element {
  const created = new Date(post.createdAt);
  const authorName = post.author.email.split("@")[0];
  const moreImages = post.images.length > 3 ? post.images.length - 3 : 0;

  return (
    <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <KCCard className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-[#3D1F0D] text-sm font-semibold text-white">
              {authorName.slice(0, 1).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-semibold text-[#3D1F0D] dark:text-[#f2dfbb]">
                {authorName} <span className="text-xs text-[#6f5a4d]">• {post.district}</span>
              </p>
              <p className="text-xs text-[#7a6658] dark:text-[#99aec8]" title={created.toLocaleString()}>
                {formatDistanceToNowStrict(created, { addSuffix: true })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <KCBadge variant={typeBadge(post.type)}>{post.type.replace("_", " ")}</KCBadge>
            {post.pinned ? <span title="Pinned">📌</span> : null}
          </div>
        </div>

        <div className="space-y-1">
          <h3 className="text-lg font-semibold">{post.title}</h3>
          <p className="text-sm text-[#5f4b3e] dark:text-[#c2d2e7]">{post.body}</p>
        </div>

        {post.images.length > 0 ? (
          <div className="grid grid-cols-3 gap-2">
            {post.images.slice(0, 3).map((image, index) => (
              <div key={`${post.id}-img-${index}`} className="relative h-24 overflow-hidden rounded-lg bg-[#f4e7d4]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image} alt="" className="h-full w-full object-cover" />
                {index === 2 && moreImages > 0 ? (
                  <div className="absolute inset-0 grid place-items-center bg-black/45 text-sm font-semibold text-white">
                    +{moreImages}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}

        {post.type === "EVENT" && post.event ? (
          <div className="rounded-xl border border-[#d8c9b3] bg-[#faf2e5] p-2 text-sm dark:border-[#27405d] dark:bg-[#14253c]">
            RSVP count: {post.event.rsvpCount}
          </div>
        ) : null}

        {post.type === "VOLUNTEER" && post.volunteer ? (
          <div className="rounded-xl border border-[#d8c9b3] bg-[#faf2e5] p-2 text-sm dark:border-[#27405d] dark:bg-[#14253c]">
            <p>Organization: {post.volunteer.organization}</p>
            <p>Skills: {post.volunteer.skills.join(", ")}</p>
            <p>Slots: {post.volunteer.slots}</p>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-2">
          <KCButton size="sm" variant="ghost" onClick={() => onUpvote(post.id)}>
            ▲ {post.upvotes}
          </KCButton>
          <KCButton size="sm" variant="ghost">
            💬 0
          </KCButton>
          <KCButton
            size="sm"
            variant="ghost"
            onClick={async () => {
              await navigator.clipboard.writeText(`${window.location.origin}/community#${post.id}`);
            }}
          >
            Share
          </KCButton>
          {post.type === "EVENT" ? (
            <KCButton size="sm" variant="secondary" onClick={() => onRsvp(post.id)}>
              RSVP
            </KCButton>
          ) : null}
          {post.type === "LOST_FOUND" && !post.resolved ? (
            <KCButton size="sm" variant="danger" onClick={() => onResolve(post.id)}>
              Mark Resolved
            </KCButton>
          ) : null}
          {post.resolved ? <KCBadge variant="verified">Resolved</KCBadge> : null}
        </div>
      </KCCard>
    </motion.div>
  );
}
