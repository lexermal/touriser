import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Touriser · enjoy your trip, Touriser manages the highlights",
  description: "Turn your trip plan into a phone app that always shows where you are and how to get to the next stop.",
  // Trip pages are private-by-link; keep everything out of search engines.
  robots: { index: false, follow: false },
  appleWebApp: { capable: true, title: "Touriser", statusBarStyle: "black-translucent" },
  icons: { apple: "/icons/apple-touch-icon.png" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full bg-slate-100 text-slate-900 dark:bg-black dark:text-slate-100">{children}</body>
    </html>
  );
}
