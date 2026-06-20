import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
  ),
  title: {
    default: "GlobalPulse News",
    template: "%s | GlobalPulse News",
  },
  description:
    "GlobalPulse News delivers breaking updates and analysis across India, World, Business, Technology, and Sports.",
  openGraph: {
    title: "GlobalPulse News",
    description:
      "Breaking news, category coverage, and editorial publishing powered by a Next.js CMS.",
    type: "website",
    siteName: "GlobalPulse News",
  },
  twitter: {
    card: "summary_large_image",
    title: "GlobalPulse News",
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
      <body className="min-h-full bg-neutral-50 text-neutral-950">{children}</body>
    </html>
  );
}
