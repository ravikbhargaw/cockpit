import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/shell/AppShell";

export const metadata: Metadata = {
  title: "Meaven Founder Cockpit",
  description: "Executive Command Center for Meaven Growth & Partner Relationships",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-cockpit-bg text-slate-100 min-h-screen flex flex-col antialiased selection:bg-meaven-blue selection:text-white">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
