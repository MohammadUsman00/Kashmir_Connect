"use client";

import * as React from "react";
import { KCBadge, KCButton, KCCard } from "@kashmir/ui";

type Internship = {
  id: string;
  companyName: string;
  role: string;
  location: string;
  stipend: string | null;
  deadline: string;
  applyUrl: string;
};

type Job = {
  id: string;
  companyName: string;
  role: string;
  location: string;
  salary: string | null;
  type: "FULL_TIME" | "PART_TIME" | "CONTRACT";
  deadline: string;
  applyUrl: string;
  preferLocal: boolean;
};

const savedKey = "kc-saved-listings";

export function ListingsSection(): JSX.Element {
export function ListingsSection({
  initialTab = "INTERNSHIPS"
}: {
  initialTab?: "INTERNSHIPS" | "JOBS";
}): JSX.Element {
  const [tab, setTab] = React.useState<"INTERNSHIPS" | "JOBS">(initialTab);
  const [internships, setInternships] = React.useState<Internship[]>([]);
  const [jobs, setJobs] = React.useState<Job[]>([]);
  const [saved, setSaved] = React.useState<string[]>([]);
  const [remoteOnly, setRemoteOnly] = React.useState(false);
  const [locationFilter, setLocationFilter] = React.useState("");
  const [preferLocal, setPreferLocal] = React.useState(false);
  const [emailAlert, setEmailAlert] = React.useState("");
  const [formType, setFormType] = React.useState<"INTERNSHIP" | "JOB">("INTERNSHIP");
  const [form, setForm] = React.useState({
    companyName: "",
    role: "",
    location: "",
    stipend: "",
    salary: "",
    deadline: "",
    applyUrl: "",
    type: "FULL_TIME" as "FULL_TIME" | "PART_TIME" | "CONTRACT",
    preferLocal: false
  });

  const load = React.useCallback(async () => {
    const query = new URLSearchParams();
    query.set("listingType", tab === "INTERNSHIPS" ? "INTERNSHIP" : "JOB");
    if (locationFilter) query.set("location", locationFilter);
    if (preferLocal) query.set("preferLocal", "true");
    const response = await fetch(`/api/students/listings?${query.toString()}`);
    const data = (await response.json()) as { internships: Internship[]; jobs: Job[] };
    setInternships(data.internships ?? []);
    setJobs(data.jobs ?? []);
  }, [locationFilter, preferLocal, tab]);

  React.useEffect(() => {
    const existing = JSON.parse(localStorage.getItem(savedKey) ?? "[]") as string[];
    setSaved(existing);
    void load();
  }, [load]);

  React.useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  const toggleSaved = (id: string) => {
    setSaved((prev) => {
      const next = prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id];
      localStorage.setItem(savedKey, JSON.stringify(next));
      return next;
    });
  };

  const postListing = async (event: React.FormEvent) => {
    event.preventDefault();
    const payload =
      formType === "INTERNSHIP"
        ? {
            listingType: "INTERNSHIP",
            companyName: form.companyName,
            role: form.role,
            location: form.location,
            stipend: form.stipend || undefined,
            deadline: form.deadline,
            applyUrl: form.applyUrl
          }
        : {
            listingType: "JOB",
            companyName: form.companyName,
            role: form.role,
            location: form.location,
            salary: form.salary || undefined,
            deadline: form.deadline,
            applyUrl: form.applyUrl,
            type: form.type,
            preferLocal: form.preferLocal
          };
    await fetch("/api/students/listings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    setForm({
      companyName: "",
      role: "",
      location: "",
      stipend: "",
      salary: "",
      deadline: "",
      applyUrl: "",
      type: "FULL_TIME",
      preferLocal: false
    });
    await load();
  };

  const listings = tab === "INTERNSHIPS" ? internships : jobs;

  return (
    <div className="space-y-4">
      <KCCard className="space-y-3">
        <h3 className="text-lg font-semibold">Post Internship / Job</h3>
        <div className="flex gap-2">
          <button onClick={() => setFormType("INTERNSHIP")} className={`rounded-full px-3 py-1 text-xs ${formType === "INTERNSHIP" ? "bg-[#3D1F0D] text-white" : "bg-[#ebddc8]"}`}>
            Internship
          </button>
          <button onClick={() => setFormType("JOB")} className={`rounded-full px-3 py-1 text-xs ${formType === "JOB" ? "bg-[#3D1F0D] text-white" : "bg-[#ebddc8]"}`}>
            Job
          </button>
        </div>
        <form className="grid gap-2 md:grid-cols-2" onSubmit={postListing}>
          <input className="h-10 rounded-lg border px-3 dark:bg-[#112239]" value={form.companyName} onChange={(e) => setForm((p) => ({ ...p, companyName: e.target.value }))} placeholder="Company name" required />
          <input className="h-10 rounded-lg border px-3 dark:bg-[#112239]" value={form.role} onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))} placeholder="Role" required />
          <input className="h-10 rounded-lg border px-3 dark:bg-[#112239]" value={form.location} onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))} placeholder="Location (remote/onsite)" required />
          <input className="h-10 rounded-lg border px-3 dark:bg-[#112239]" value={formType === "INTERNSHIP" ? form.stipend : form.salary} onChange={(e) => setForm((p) => ({ ...p, [formType === "INTERNSHIP" ? "stipend" : "salary"]: e.target.value }))} placeholder={formType === "INTERNSHIP" ? "Stipend" : "Salary"} />
          <input type="date" className="h-10 rounded-lg border px-3 dark:bg-[#112239]" value={form.deadline} onChange={(e) => setForm((p) => ({ ...p, deadline: e.target.value }))} required />
          <input className="h-10 rounded-lg border px-3 dark:bg-[#112239]" value={form.applyUrl} onChange={(e) => setForm((p) => ({ ...p, applyUrl: e.target.value }))} placeholder="Apply URL" required />
          {formType === "JOB" ? (
            <>
              <select className="h-10 rounded-lg border px-3 dark:bg-[#112239]" value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value as "FULL_TIME" | "PART_TIME" | "CONTRACT" }))}>
                <option value="FULL_TIME">Full-time</option>
                <option value="PART_TIME">Part-time</option>
                <option value="CONTRACT">Contract</option>
              </select>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.preferLocal} onChange={(e) => setForm((p) => ({ ...p, preferLocal: e.target.checked }))} />
                Prefer local candidates
              </label>
            </>
          ) : null}
          <KCButton className="md:col-span-2">Post Listing</KCButton>
        </form>
      </KCCard>

      <KCCard className="space-y-3">
        <h3 className="text-lg font-semibold">Filters</h3>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setTab("INTERNSHIPS")} className={`rounded-full px-3 py-1 text-xs ${tab === "INTERNSHIPS" ? "bg-[#3D1F0D] text-white" : "bg-[#ebddc8]"}`}>Internships</button>
          <button onClick={() => setTab("JOBS")} className={`rounded-full px-3 py-1 text-xs ${tab === "JOBS" ? "bg-[#3D1F0D] text-white" : "bg-[#ebddc8]"}`}>Jobs</button>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={remoteOnly} onChange={(e) => setRemoteOnly(e.target.checked)} />
            Remote
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={preferLocal} onChange={(e) => setPreferLocal(e.target.checked)} />
            Prefer Local
          </label>
          <input className="h-9 rounded-lg border px-3 text-sm dark:bg-[#112239]" value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)} placeholder="Location" />
          <KCButton size="sm" variant="ghost" onClick={() => void load()}>
            Apply
          </KCButton>
        </div>
      </KCCard>

      <KCCard className="space-y-2">
        <h3 className="text-lg font-semibold">Email alert subscription</h3>
        <div className="flex gap-2">
          <input className="h-10 flex-1 rounded-lg border px-3 dark:bg-[#112239]" value={emailAlert} onChange={(e) => setEmailAlert(e.target.value)} placeholder="Your email for new matching listings" />
          <KCButton
            onClick={async () => {
              if (!emailAlert.trim()) return;
              localStorage.setItem("kc-student-alert-email", emailAlert.trim());
              await fetch("/api/students/email-alerts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: emailAlert.trim(), listingType: tab === "JOBS" ? "JOB" : "INTERNSHIP" })
              });
            }}
          >
            Subscribe
          </KCButton>
        </div>
      </KCCard>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {listings
          .filter((item) => (remoteOnly ? item.location.toLowerCase().includes("remote") : true))
          .map((item) => {
            const isSaved = saved.includes(item.id);
            const whatsappMsg = encodeURIComponent(`Hi, I am interested in the ${item.role} opportunity at ${item.companyName}.`);
            return (
              <KCCard key={item.id} className="space-y-2">
                <p className="text-sm font-semibold">{item.companyName}</p>
                <p className="text-sm">{item.role}</p>
                <p className="text-xs text-[#6e5a4d] dark:text-[#a9bfd8]">{item.location}</p>
                {"type" in item ? <KCBadge variant="sector">{item.type.replace("_", " ")}</KCBadge> : null}
                {"preferLocal" in item && item.preferLocal ? <KCBadge variant="featured">Prefer Local</KCBadge> : null}
                <div className="flex flex-wrap gap-2">
                  <a href={item.applyUrl} target="_blank" rel="noopener noreferrer">
                    <KCButton size="sm">Apply</KCButton>
                  </a>
                  <a href={`https://wa.me/?text=${whatsappMsg}`} target="_blank" rel="noopener noreferrer">
                    <KCButton size="sm" variant="secondary">
                      WhatsApp Apply
                    </KCButton>
                  </a>
                  <KCButton size="sm" variant="ghost" onClick={() => toggleSaved(item.id)}>
                    {isSaved ? "Saved" : "Save"}
                  </KCButton>
                </div>
              </KCCard>
            );
          })}
      </div>
    </div>
  );
}
