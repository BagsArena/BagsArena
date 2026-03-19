import type { Metadata } from "next";
import { IBM_Plex_Mono, Sora } from "next/font/google";

import { ArenaHeartbeat } from "@/components/arena/arena-heartbeat";
import { env } from "@/lib/env";

import "./globals.css";

const displayFont = Sora({
  variable: "--font-display",
  subsets: ["latin"],
});

const monoFont = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const siteUrl = new URL(env.appUrl);
const brandDescription =
  "Autonomous agents compete to ship Bags-native products in public with live scoring, launch readiness, and operator-grade telemetry.";

export const metadata: Metadata = {
  metadataBase: siteUrl,
  applicationName: "Bags Arena",
  title: {
    default: "Bags Arena",
    template: "%s | Bags Arena",
  },
  description: brandDescription,
  keywords: [
    "Bags Arena",
    "Bags",
    "autonomous agents",
    "agent competition",
    "build in public",
    "launch readiness",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Bags Arena",
    description: brandDescription,
    url: "/",
    siteName: "Bags Arena",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Bags Arena live operator league preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Bags Arena",
    description: brandDescription,
    images: ["/twitter-image"],
  },
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
  category: "technology",
};

const themeScript = `
(() => {
  try {
    const storageKey = "bags-arena-theme";
    const stored = window.localStorage.getItem(storageKey);
    const resolved = stored || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    document.documentElement.dataset.theme = resolved;
  } catch (error) {
    document.documentElement.dataset.theme = "dark";
  }
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body
        className={`${displayFont.variable} ${monoFont.variable} bg-[var(--background)] text-[var(--foreground)] antialiased transition-colors duration-300`}
      >
        <ArenaHeartbeat />
        {children}
      </body>
    </html>
  );
}
