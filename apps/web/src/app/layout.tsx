import type { Metadata } from "next";
import { Geist, Noto_Nastaliq_Urdu } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { KashmirAssistant } from "@/components/ai/KashmirAssistant";
import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans"
});

const nastaliq = Noto_Nastaliq_Urdu({
  subsets: ["arabic"],
  variable: "--font-nastaliq"
});

export const metadata: Metadata = {
  title: "Kashmir Connect",
  description: "Kashmir's Digital Operating System - Apple clarity, Airbnb warmth, Kashmir culture"
};

export default function RootLayout({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geist.variable} ${nastaliq.variable}`}>
        <ThemeProvider>
          {children}
          <KashmirAssistant />
        </ThemeProvider>
      </body>
    </html>
  );
}
