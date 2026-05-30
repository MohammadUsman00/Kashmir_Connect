"use client";

import * as React from "react";
import { KCButton } from "@kashmir/ui";
import { NotificationBell } from "@/components/community/NotificationBell";
import { NotesSection } from "@/components/students/NotesSection";
import { ListingsSection } from "@/components/students/ListingsSection";
import { CollegeGroupsSection } from "@/components/students/CollegeGroupsSection";

type Tab = "NOTES" | "INTERNSHIPS" | "JOBS" | "COLLEGE_GROUPS";

const tabs: Array<{ id: Tab; label: string }> = [
  { id: "NOTES", label: "Notes" },
  { id: "INTERNSHIPS", label: "Internships" },
  { id: "JOBS", label: "Jobs" },
  { id: "COLLEGE_GROUPS", label: "College Groups" }
];

export default function StudentsPage(): JSX.Element {
  const [tab, setTab] = React.useState<Tab>("NOTES");

  return (
    <main className="mx-auto max-w-7xl space-y-5 p-4 md:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-[#3D1F0D] dark:text-[#f3dfbb]">Student Network</h1>
          <p className="text-sm text-[#6b5648] dark:text-[#bdd0e4]">
            Notes, internships, jobs, and college communities across Kashmir institutions.
          </p>
        </div>
        <NotificationBell />
      </div>

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

      {tab === "NOTES" ? <NotesSection /> : null}
      {tab === "INTERNSHIPS" ? <ListingsSection initialTab="INTERNSHIPS" /> : null}
      {tab === "JOBS" ? <ListingsSection initialTab="JOBS" /> : null}
      {tab === "COLLEGE_GROUPS" ? <CollegeGroupsSection /> : null}

      <div className="rounded-2xl border border-[#dfcfb8] bg-white/90 p-4 dark:border-[#27405f] dark:bg-[#102238]/90">
        <h3 className="text-lg font-semibold">Notification preferences</h3>
        <p className="mb-3 text-sm text-[#6b5648] dark:text-[#bdd0e4]">
          Manage replies to your posts, district alerts, RSVP confirmations, and jobs matching your skills.
        </p>
        <div className="flex flex-wrap gap-2">
          <KCButton
            size="sm"
            onClick={async () =>
              fetch("/api/community/notifications", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  action: "setPrefs",
                  prefs: {
                    postReplies: true,
                    districtPosts: true,
                    rsvpConfirmations: true,
                    jobMatches: true
                  }
                })
              })
            }
          >
            Enable all
          </KCButton>
          <KCButton
            size="sm"
            variant="ghost"
            onClick={async () =>
              fetch("/api/community/notifications", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  action: "setPrefs",
                  prefs: {
                    postReplies: false,
                    districtPosts: false,
                    rsvpConfirmations: false,
                    jobMatches: false
                  }
                })
              })
            }
          >
            Disable all
          </KCButton>
        </div>
      </div>
    </main>
  );
}
