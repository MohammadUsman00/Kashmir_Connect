"use client";

import { useTheme } from "next-themes";
import { KCButton } from "@kashmir/ui";

export function ThemeToggle(): JSX.Element {
  const { resolvedTheme, setTheme } = useTheme();
  const dark = resolvedTheme === "dark";

  return (
    <KCButton
      variant="ghost"
      size="sm"
      aria-label="Toggle dark mode"
      onClick={() => setTheme(dark ? "light" : "dark")}
    >
      {dark ? "Light" : "Dark"}
    </KCButton>
  );
}
