"use client";

import * as React from "react";
import { KCBadge, KCButton, KCCard } from "@kashmir/ui";

type NoteItem = {
  id: string;
  subject: string;
  class: string;
  university: string;
  fileUrl: string;
  downloads: number;
  verified: boolean;
  createdAt: string;
  author: { email: string };
};

export function NotesSection(): JSX.Element {
  const [notes, setNotes] = React.useState<NoteItem[]>([]);
  const [subjectFilter, setSubjectFilter] = React.useState("");
  const [universityFilter, setUniversityFilter] = React.useState("");
  const [classFilter, setClassFilter] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [uploading, setUploading] = React.useState(false);
  const [form, setForm] = React.useState({
    subject: "",
    class: "",
    university: "",
    fileUrl: "",
    fileType: "pdf" as "pdf" | "image"
  });

  const load = React.useCallback(async () => {
    setLoading(true);
    const query = new URLSearchParams();
    if (subjectFilter) query.set("subject", subjectFilter);
    if (universityFilter) query.set("university", universityFilter);
    if (classFilter) query.set("class", classFilter);
    const response = await fetch(`/api/students/notes?${query.toString()}`);
    const data = (await response.json()) as { notes: NoteItem[] };
    setNotes(data.notes ?? []);
    setLoading(false);
  }, [classFilter, subjectFilter, universityFilter]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const onUpload = async (event: React.FormEvent) => {
    event.preventDefault();
    setUploading(true);
    try {
      await fetch("/api/students/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      setForm({ subject: "", class: "", university: "", fileUrl: "", fileType: "pdf" });
      await load();
    } finally {
      setUploading(false);
    }
  };

  const onDownload = async (id: string, fileUrl: string) => {
    await fetch(`/api/students/notes/${id}/download`, { method: "POST" });
    window.open(fileUrl, "_blank", "noopener,noreferrer");
    await load();
  };

  return (
    <div className="space-y-4">
      <KCCard className="space-y-3">
        <h3 className="text-lg font-semibold">Upload Notes</h3>
        <form className="grid gap-2 md:grid-cols-2" onSubmit={onUpload}>
          <input className="h-10 rounded-lg border px-3 dark:bg-[#12243b]" value={form.subject} onChange={(e) => setForm((prev) => ({ ...prev, subject: e.target.value }))} placeholder="Subject" required />
          <input className="h-10 rounded-lg border px-3 dark:bg-[#12243b]" value={form.class} onChange={(e) => setForm((prev) => ({ ...prev, class: e.target.value }))} placeholder="Class / Semester" required />
          <input className="h-10 rounded-lg border px-3 dark:bg-[#12243b]" value={form.university} onChange={(e) => setForm((prev) => ({ ...prev, university: e.target.value }))} placeholder="University" required />
          <select className="h-10 rounded-lg border px-3 dark:bg-[#12243b]" value={form.fileType} onChange={(e) => setForm((prev) => ({ ...prev, fileType: e.target.value as "pdf" | "image" }))}>
            <option value="pdf">PDF</option>
            <option value="image">Image (OCR enabled)</option>
          </select>
          <input className="h-10 rounded-lg border px-3 dark:bg-[#12243b] md:col-span-2" value={form.fileUrl} onChange={(e) => setForm((prev) => ({ ...prev, fileUrl: e.target.value }))} placeholder="File URL" required />
          <KCButton type="submit" loading={uploading} className="md:col-span-2">
            Upload Note
          </KCButton>
        </form>
      </KCCard>

      <KCCard className="space-y-3">
        <h3 className="text-lg font-semibold">Search Notes</h3>
        <div className="grid gap-2 md:grid-cols-3">
          <input className="h-10 rounded-lg border px-3 dark:bg-[#12243b]" value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)} placeholder="Subject" />
          <input className="h-10 rounded-lg border px-3 dark:bg-[#12243b]" value={universityFilter} onChange={(e) => setUniversityFilter(e.target.value)} placeholder="University" />
          <input className="h-10 rounded-lg border px-3 dark:bg-[#12243b]" value={classFilter} onChange={(e) => setClassFilter(e.target.value)} placeholder="Semester" />
        </div>
      </KCCard>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {loading ? <p>Loading notes...</p> : null}
        {!loading &&
          notes.map((note) => (
            <KCCard key={note.id} className="space-y-2">
              <p className="text-sm font-semibold">{note.subject}</p>
              <p className="text-xs text-[#6e5a4d] dark:text-[#a9bfd8]">
                {note.class} • {note.university}
              </p>
              <p className="text-xs text-[#6e5a4d] dark:text-[#a9bfd8]">Uploader: {note.author.email.split("@")[0]}</p>
              <div className="flex items-center gap-2">
                {note.verified ? <KCBadge variant="verified">Verified</KCBadge> : <KCBadge variant="pending">Unverified</KCBadge>}
                <span className="text-xs">{note.downloads} downloads</span>
              </div>
              <KCButton size="sm" onClick={() => onDownload(note.id, note.fileUrl)}>
                Download
              </KCButton>
            </KCCard>
          ))}
      </div>
    </div>
  );
}
