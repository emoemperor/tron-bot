import type { Metadata } from "next";
import "./globals.css";

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
      <body className="min-h-screen w-screen">{children}</body>
    </html>
  );
}
