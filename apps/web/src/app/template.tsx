"use client";

import { usePathname } from "next/navigation";
import { KCPageTransition } from "@kashmir/ui";

export default function Template({ children }: { children: React.ReactNode }): JSX.Element {
  const pathname = usePathname();
  return <KCPageTransition routeKey={pathname}>{children}</KCPageTransition>;
}
