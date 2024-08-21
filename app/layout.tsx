import type { Metadata } from "next";
import "./globals.css";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/react";
export const metadata: Metadata = {
  title: "Telegram",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh">
      <body className="min-h-screen w-screen">
        {children}
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
