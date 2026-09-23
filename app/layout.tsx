import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/shell/Header";
import { Navigation } from "@/components/shell/Navigation";

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
        {/* Header Shell */}
        <Header />

        {/* Primary Navigation Shell */}
        <Navigation />

        {/* Main Application Area */}
        <main className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-6">
          {children}
        </main>

        {/* Executive Footer */}
        <footer className="w-full border-t border-cockpit-border py-4 px-6 text-center text-xs text-cockpit-subtle font-mono">
          <span>Meaven Founder Cockpit • Local Executive Foundation • Strict Local Mode</span>
        </footer>
      </body>
    </html>
  );
}
