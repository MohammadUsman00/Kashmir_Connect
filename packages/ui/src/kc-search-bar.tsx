"use client";

import * as React from "react";
import { KCButton } from "./kc-button";
import { cn } from "./utils";

export function KCSearchBar({
  placeholder = "Search businesses, districts, crafts...",
  onSearch,
  className
}: {
  placeholder?: string;
  onSearch?: (value: string) => void;
  className?: string;
}): JSX.Element {
  const [query, setQuery] = React.useState("");
  const [lang, setLang] = React.useState<"EN" | "UR">("EN");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(query);
  };

  const onVoice = () => {
    onSearch?.(query);
  };

  return (
    <form onSubmit={submit} className={cn("flex w-full items-center gap-2 rounded-2xl border border-white/50 bg-white/30 p-2 backdrop-blur-md dark:border-[#2d3f5a] dark:bg-[#111d2d]/50", className)}>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="h-10 flex-1 rounded-xl bg-white/80 px-3 text-sm text-[#3D1F0D] outline-none placeholder:text-[#7f6a57] dark:bg-[#0e1a2a] dark:text-[#f4e2c1] dark:placeholder:text-[#8aa0b9]"
      />
      <KCButton type="button" variant="ghost" size="sm" onClick={onVoice} aria-label="Voice input">
        🎤
      </KCButton>
      <KCButton
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setLang((prev) => (prev === "EN" ? "UR" : "EN"))}
        aria-label="Toggle language"
      >
        {lang}
      </KCButton>
      <KCButton type="submit" size="sm">
        Search
      </KCButton>
    </form>
  );
}
