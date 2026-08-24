import type { Metadata } from "next";
import "./globals.css";

import { ToastProvider } from "@/components/ui/Toast";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
  ),
  title: {
    default: "VIDARBHA PRINT News",
    template: "%s | VIDARBHA PRINT News",
  },
  description:
    "VIDARBHA PRINT News delivers breaking updates and analysis across India, World, Business, Technology, and Sports.",
  openGraph: {
    title: "VIDARBHA PRINT News",
    description:
      "Breaking news, category coverage, and editorial publishing powered by a Next.js CMS.",
    type: "website",
    siteName: "VIDARBHA PRINT News",
  },
  twitter: {
    card: "summary_large_image",
    title: "VIDARBHA PRINT News",
    description:
      "Breaking news, category coverage, and editorial publishing powered by a Next.js CMS.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body className="min-h-full bg-neutral-50 text-neutral-950">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
