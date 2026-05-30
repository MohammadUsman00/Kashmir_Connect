"use client";

import * as React from "react";
import { KCBadge, KCButton, KCCard } from "@kashmir/ui";

type GroupAnnouncement = {
  id: string;
  title: string;
  body: string;
  pinned: boolean;
  createdAt: string;
};

type Group = {
  id: string;
  slug: string;
  name: string;
  _count: { members: number; announcements: number };
  members: Array<{ user: { email: string } }>;
  announcements: GroupAnnouncement[];
};

export function CollegeGroupsSection(): JSX.Element {
  const [groups, setGroups] = React.useState<Group[]>([]);
  const [activeGroup, setActiveGroup] = React.useState<string>("");
  const [announceTitle, setAnnounceTitle] = React.useState("");
  const [announceBody, setAnnounceBody] = React.useState("");

  const load = React.useCallback(async () => {
    const response = await fetch("/api/students/groups");
    const data = (await response.json()) as { groups: Group[] };
    setGroups(data.groups ?? []);
    if (!activeGroup && data.groups?.[0]?.id) setActiveGroup(data.groups[0].id);
  }, [activeGroup]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const onJoinLeave = async (groupId: string, action: "join" | "leave") => {
    await fetch("/api/students/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, groupId })
    });
    await load();
  };

  const onAnnounce = async () => {
    if (!activeGroup || !announceTitle.trim() || !announceBody.trim()) return;
    await fetch("/api/students/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "announce",
        groupId: activeGroup,
        title: announceTitle,
        body: announceBody
      })
    });
    setAnnounceTitle("");
    setAnnounceBody("");
    await load();
  };

  const group = groups.find((item) => item.id === activeGroup) ?? null;

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
      <KCCard className="space-y-2">
        <h3 className="text-lg font-semibold">College Groups</h3>
        <div className="space-y-2">
          {groups.map((item) => (
            <button
              key={item.id}
              className={`w-full rounded-xl border px-3 py-2 text-left ${
                activeGroup === item.id ? "border-[#C8972A] bg-[#f7ecd8]" : "border-[#dfcfb8] dark:border-[#2a4160]"
              }`}
              onClick={() => setActiveGroup(item.id)}
            >
              <p className="text-sm font-semibold">{item.name}</p>
              <p className="text-xs text-[#6e5a4d] dark:text-[#a9bfd8]">
                {item._count.members} members • {item._count.announcements} announcements
              </p>
            </button>
          ))}
        </div>
      </KCCard>

      <KCCard className="space-y-3">
        {group ? (
          <>
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="text-xl font-semibold">{group.name}</h3>
                <p className="text-xs text-[#6e5a4d] dark:text-[#a9bfd8]">
                  Members: {group._count.members}
                </p>
              </div>
              <div className="flex gap-2">
                <KCButton size="sm" onClick={() => void onJoinLeave(group.id, "join")}>
                  Join
                </KCButton>
                <KCButton size="sm" variant="ghost" onClick={() => void onJoinLeave(group.id, "leave")}>
                  Leave
                </KCButton>
              </div>
            </div>

            <div className="space-y-2 rounded-xl border border-[#e2d4be] p-3 dark:border-[#2a4160]">
              <p className="text-sm font-semibold">Post announcement</p>
              <input
                className="h-10 w-full rounded-lg border px-3 dark:bg-[#112239]"
                value={announceTitle}
                onChange={(e) => setAnnounceTitle(e.target.value)}
                placeholder="Announcement title"
              />
              <textarea
                className="w-full rounded-lg border px-3 py-2 dark:bg-[#112239]"
                rows={3}
                value={announceBody}
                onChange={(e) => setAnnounceBody(e.target.value)}
                placeholder="Announcement details"
              />
              <KCButton size="sm" onClick={onAnnounce}>
                Publish
              </KCButton>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold">Members</p>
              <div className="flex flex-wrap gap-2">
                {group.members.length === 0 ? (
                  <p className="text-sm text-[#765f50] dark:text-[#9fb4cb]">No members yet.</p>
                ) : (
                  group.members.map((member) => (
                    <span
                      key={`${group.id}-${member.user.email}`}
                      className="rounded-full border border-[#e2d4be] px-3 py-1 text-xs dark:border-[#2a4160]"
                    >
                      {member.user.email.split("@")[0]}
                    </span>
                  ))
                )}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold">Pinned resources & announcements</p>
              {group.announcements.length === 0 ? (
                <p className="text-sm text-[#765f50] dark:text-[#9fb4cb]">No announcements yet.</p>
              ) : (
                group.announcements.map((announcement) => (
                  <div key={announcement.id} className="rounded-xl border border-[#e2d4be] p-3 dark:border-[#2a4160]">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold">{announcement.title}</p>
                      {announcement.pinned ? <KCBadge variant="featured">Pinned</KCBadge> : null}
                    </div>
                    <p className="text-sm text-[#614d40] dark:text-[#c2d2e7]">{announcement.body}</p>
                    <p className="text-xs text-[#7a6658] dark:text-[#99aec8]">
                      {new Date(announcement.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          <p>Select a group</p>
        )}
      </KCCard>
    </div>
  );
}
