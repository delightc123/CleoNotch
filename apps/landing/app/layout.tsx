import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0e0f12",
};

export const metadata: Metadata = {
  title: "HeyCleo! — Your Desktop Has an AI Companion. Not Another Window.",
  description:
    "Cleo lives in your notch and follows your cursor. Monitor autonomous coding agents, dictate at the speed of thought, and access Raycast-grade productivity without ever switching apps.",
  keywords: [
    "AI desktop companion",
    "Notch HUD",
    "Claude Code",
    "Cursor AI",
    "Autonomous Agents",
    "Push to talk dictation",
    "Wispr Flow alternative",
    "Raycast alternative",
    "Tauri v2",
    "Mochi mascot"
  ],
  authors: [{ name: "Delight Chukwu", url: "https://github.com/delightc123" }],
  creator: "Delight Chukwu",
  publisher: "CleoNotch",
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "HeyCleo! — Ambient AI Desktop Companion & Productivity HUD",
    description:
      "Cleo lives in your notch and follows your cursor. Monitor autonomous coding agents, dictate at the speed of thought, and access Raycast-grade productivity without ever switching apps.",
    url: "https://cleonotch.com",
    siteName: "CleoNotch",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "HeyCleo! — Ambient AI Desktop Companion & Productivity HUD",
    description:
      "Your desktop has an AI companion. Not another window. Monitor autonomous coding agents and dictate at the speed of thought.",
    creator: "@delightc123",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#0e0f12] text-[#f5f6f8] antialiased w-full">
        {children}
      </body>
    </html>
  );
}
