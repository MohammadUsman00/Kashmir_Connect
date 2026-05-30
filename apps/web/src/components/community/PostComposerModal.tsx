"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { KCButton, KCCard } from "@kashmir/ui";
import { JK_DISTRICTS, TEHSILS_BY_DISTRICT } from "@/lib/community/locations";

type PostType = "ANNOUNCEMENT" | "EVENT" | "LOST_FOUND" | "VOLUNTEER" | "DISCUSSION";

export function PostComposerModal({
  open,
  onClose,
  onCreated
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => Promise<void> | void;
}): JSX.Element {
  const [type, setType] = React.useState<PostType>("DISCUSSION");
  const [title, setTitle] = React.useState("");
  const [district, setDistrict] = React.useState("Srinagar");
  const [tehsil, setTehsil] = React.useState("");
  const [imagesText, setImagesText] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [eventDate, setEventDate] = React.useState("");
  const [eventLocation, setEventLocation] = React.useState("");
  const [eventMax, setEventMax] = React.useState<number | "">(50);
  const [eventTicket, setEventTicket] = React.useState<number | "">("");
  const [lostFoundCategory, setLostFoundCategory] = React.useState("");
  const [lostFoundLocation, setLostFoundLocation] = React.useState("");
  const [lostFoundPhone, setLostFoundPhone] = React.useState("");
  const [lostFoundItemType, setLostFoundItemType] = React.useState<"LOST" | "FOUND">("LOST");
  const [volunteerOrg, setVolunteerOrg] = React.useState("");
  const [volunteerSkills, setVolunteerSkills] = React.useState("");
  const [volunteerStartDate, setVolunteerStartDate] = React.useState("");
  const [volunteerEndDate, setVolunteerEndDate] = React.useState("");
  const [volunteerSlots, setVolunteerSlots] = React.useState<number | "">(20);

  const editor = useEditor({
    extensions: [StarterKit],
    content: "<p>Share details with the community...</p>"
  });

  const reset = () => {
    setType("DISCUSSION");
    setTitle("");
    setDistrict("Srinagar");
    setTehsil("");
    setImagesText("");
    setEventDate("");
    setEventLocation("");
    setEventMax(50);
    setEventTicket("");
    setLostFoundCategory("");
    setLostFoundLocation("");
    setLostFoundPhone("");
    setLostFoundItemType("LOST");
    setVolunteerOrg("");
    setVolunteerSkills("");
    setVolunteerStartDate("");
    setVolunteerEndDate("");
    setVolunteerSlots(20);
    editor?.commands.setContent("<p>Share details with the community...</p>");
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editor) return;
    setSubmitting(true);
    try {
      const body = {
        type,
        title,
        body: editor.getText().trim(),
        images: imagesText
          .split("\n")
          .map((item) => item.trim())
          .filter(Boolean)
          .slice(0, 5),
        district,
        tehsil: tehsil || undefined,
        event:
          type === "EVENT"
            ? {
                date: eventDate || new Date().toISOString(),
                location: eventLocation || `${district}, Kashmir`,
                maxAttendees: typeof eventMax === "number" ? eventMax : undefined,
                ticketPrice: typeof eventTicket === "number" ? eventTicket : undefined
              }
            : undefined,
        lostFound:
          type === "LOST_FOUND"
            ? {
                itemType: lostFoundItemType,
                category: lostFoundCategory || "General",
                lastSeenLocation: lostFoundLocation || district,
                contactPhone: lostFoundPhone || "N/A"
              }
            : undefined,
        volunteer:
          type === "VOLUNTEER"
            ? {
                organization: volunteerOrg || "Community Group",
                skills: volunteerSkills
                  .split(",")
                  .map((item) => item.trim())
                  .filter(Boolean),
                startDate: volunteerStartDate || new Date().toISOString(),
                endDate: volunteerEndDate || undefined,
                slots: typeof volunteerSlots === "number" ? volunteerSlots : 20
              }
            : undefined
      };

      const response = await fetch("/api/community/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      if (!response.ok) {
        throw new Error(await response.text());
      }
      reset();
      await onCreated();
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/45 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 24, scale: 0.98 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: 24, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="mx-auto mt-4 max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-4 dark:bg-[#0f1b2d]"
            onClick={(e) => e.stopPropagation()}
          >
            <KCCard className="space-y-3">
              <h2 className="text-xl font-semibold">Create Community Post</h2>

              <form className="space-y-3" onSubmit={submit}>
                <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
                  {(["ANNOUNCEMENT", "EVENT", "LOST_FOUND", "VOLUNTEER", "DISCUSSION"] as PostType[]).map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setType(item)}
                      className={`rounded-lg border px-2 py-2 text-xs ${
                        type === item ? "border-[#C8972A] bg-[#f7ecd8]" : "border-[#decfb8] bg-white dark:border-[#2b425f] dark:bg-[#13253d]"
                      }`}
                    >
                      {item.replace("_", " ")}
                    </button>
                  ))}
                </div>

                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  required
                  placeholder="Title"
                  className="h-10 w-full rounded-lg border border-[#decfb8] bg-white px-3 text-sm dark:border-[#2b425f] dark:bg-[#13253d]"
                />

                <div className="rounded-lg border border-[#decfb8] bg-white p-2 dark:border-[#2b425f] dark:bg-[#13253d]">
                  <EditorContent editor={editor} className="min-h-[120px] text-sm" />
                </div>

                <textarea
                  value={imagesText}
                  onChange={(event) => setImagesText(event.target.value)}
                  rows={3}
                  placeholder="Image URLs (one per line, max 5)"
                  className="w-full rounded-lg border border-[#decfb8] bg-white px-3 py-2 text-sm dark:border-[#2b425f] dark:bg-[#13253d]"
                />

                <div className="grid gap-2 md:grid-cols-2">
                  <select
                    value={district}
                    onChange={(event) => {
                      setDistrict(event.target.value);
                      setTehsil("");
                    }}
                    className="h-10 rounded-lg border border-[#decfb8] bg-white px-3 text-sm dark:border-[#2b425f] dark:bg-[#13253d]"
                  >
                    {JK_DISTRICTS.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                  <select
                    value={tehsil}
                    onChange={(event) => setTehsil(event.target.value)}
                    className="h-10 rounded-lg border border-[#decfb8] bg-white px-3 text-sm dark:border-[#2b425f] dark:bg-[#13253d]"
                  >
                    <option value="">Select tehsil</option>
                    {(TEHSILS_BY_DISTRICT[district] ?? []).map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>

                {type === "EVENT" ? (
                  <div className="grid gap-2 md:grid-cols-2">
                    <input type="datetime-local" value={eventDate} onChange={(event) => setEventDate(event.target.value)} className="h-10 rounded-lg border border-[#decfb8] bg-white px-3 text-sm dark:border-[#2b425f] dark:bg-[#13253d]" />
                    <input value={eventLocation} onChange={(event) => setEventLocation(event.target.value)} placeholder="Event location" className="h-10 rounded-lg border border-[#decfb8] bg-white px-3 text-sm dark:border-[#2b425f] dark:bg-[#13253d]" />
                    <input type="number" value={eventMax} onChange={(event) => setEventMax(Number(event.target.value) || "")} placeholder="Max attendees" className="h-10 rounded-lg border border-[#decfb8] bg-white px-3 text-sm dark:border-[#2b425f] dark:bg-[#13253d]" />
                    <input type="number" value={eventTicket} onChange={(event) => setEventTicket(Number(event.target.value) || "")} placeholder="Ticket price (optional)" className="h-10 rounded-lg border border-[#decfb8] bg-white px-3 text-sm dark:border-[#2b425f] dark:bg-[#13253d]" />
                  </div>
                ) : null}

                {type === "LOST_FOUND" ? (
                  <div className="grid gap-2 md:grid-cols-2">
                    <select value={lostFoundItemType} onChange={(event) => setLostFoundItemType(event.target.value as "LOST" | "FOUND")} className="h-10 rounded-lg border border-[#decfb8] bg-white px-3 text-sm dark:border-[#2b425f] dark:bg-[#13253d]">
                      <option value="LOST">Lost</option>
                      <option value="FOUND">Found</option>
                    </select>
                    <input value={lostFoundCategory} onChange={(event) => setLostFoundCategory(event.target.value)} placeholder="Item category" className="h-10 rounded-lg border border-[#decfb8] bg-white px-3 text-sm dark:border-[#2b425f] dark:bg-[#13253d]" />
                    <input value={lostFoundLocation} onChange={(event) => setLostFoundLocation(event.target.value)} placeholder="Last seen location" className="h-10 rounded-lg border border-[#decfb8] bg-white px-3 text-sm dark:border-[#2b425f] dark:bg-[#13253d]" />
                    <input value={lostFoundPhone} onChange={(event) => setLostFoundPhone(event.target.value)} placeholder="Contact phone" className="h-10 rounded-lg border border-[#decfb8] bg-white px-3 text-sm dark:border-[#2b425f] dark:bg-[#13253d]" />
                  </div>
                ) : null}

                {type === "VOLUNTEER" ? (
                  <div className="grid gap-2 md:grid-cols-2">
                    <input value={volunteerOrg} onChange={(event) => setVolunteerOrg(event.target.value)} placeholder="Organization" className="h-10 rounded-lg border border-[#decfb8] bg-white px-3 text-sm dark:border-[#2b425f] dark:bg-[#13253d]" />
                    <input value={volunteerSkills} onChange={(event) => setVolunteerSkills(event.target.value)} placeholder="Skills needed (comma separated)" className="h-10 rounded-lg border border-[#decfb8] bg-white px-3 text-sm dark:border-[#2b425f] dark:bg-[#13253d]" />
                    <input type="date" value={volunteerStartDate} onChange={(event) => setVolunteerStartDate(event.target.value)} className="h-10 rounded-lg border border-[#decfb8] bg-white px-3 text-sm dark:border-[#2b425f] dark:bg-[#13253d]" />
                    <input type="date" value={volunteerEndDate} onChange={(event) => setVolunteerEndDate(event.target.value)} className="h-10 rounded-lg border border-[#decfb8] bg-white px-3 text-sm dark:border-[#2b425f] dark:bg-[#13253d]" />
                    <input type="number" value={volunteerSlots} onChange={(event) => setVolunteerSlots(Number(event.target.value) || "")} placeholder="Slots" className="h-10 rounded-lg border border-[#decfb8] bg-white px-3 text-sm dark:border-[#2b425f] dark:bg-[#13253d]" />
                  </div>
                ) : null}

                <div className="flex justify-end gap-2">
                  <KCButton type="button" variant="ghost" onClick={onClose}>
                    Cancel
                  </KCButton>
                  <KCButton type="submit" loading={submitting}>
                    Publish Post
                  </KCButton>
                </div>
              </form>
            </KCCard>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
