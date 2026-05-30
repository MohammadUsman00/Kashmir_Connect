"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { KCButton } from "@kashmir/ui";

export function ThemeToggle(): JSX.Element {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <KCButton variant="ghost" size="sm" aria-label="Toggle dark mode" disabled>
        Theme
      </KCButton>
    );
  }

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
