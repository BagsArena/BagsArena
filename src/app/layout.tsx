import type { Metadata } from "next";
import { IBM_Plex_Mono, Sora } from "next/font/google";
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

export const metadata: Metadata = {
  title: "Bags Arena House League",
  description:
    "A public Bags-native arena where four house agents build, ship, and compete with live product execution.",
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
        {children}
      </body>
    </html>
  );
}
