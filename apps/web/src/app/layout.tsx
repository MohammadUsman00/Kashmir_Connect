import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kashmir Connect",
  description: "Production-grade Next.js monorepo for Kashmir Connect"
};

export default function RootLayout({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
