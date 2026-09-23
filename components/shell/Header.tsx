'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Command, User, ShieldCheck, LogOut } from 'lucide-react';
import { AICommandBar } from './AICommandBar';

export const Header: React.FC = () => {
  const router = useRouter();
  const [isCommandBarOpen, setIsCommandBarOpen] = useState(false);

  const handleLogout = async () => {
    if (!confirm('Are you sure you want to log out of Founder Cockpit?')) return;
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch {
      alert('Logout failed');
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-cockpit-bg/90 backdrop-blur-md border-b border-cockpit-border px-6 py-3.5 flex items-center justify-between">
        {/* Brand Wordmark */}
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-meaven-blue shadow-glow-meaven animate-pulse" />
          <div className="flex flex-col">
            <span className="text-sm font-bold tracking-widest text-slate-100 uppercase font-mono">
              FOUNDER COCKPIT
            </span>
            <span className="text-[10px] tracking-wider text-meaven-blue uppercase font-medium">
              Meaven Growth & Relationships
            </span>
          </div>
        </div>

        {/* Global AI Command Bar Trigger */}
        <div className="flex-1 max-w-xl mx-8">
          <button
            onClick={() => setIsCommandBarOpen(true)}
            className="w-full flex items-center justify-between px-4 py-2 bg-cockpit-surface border border-cockpit-border hover:border-meaven-blue/50 rounded-lg text-sm text-cockpit-muted transition-all shadow-sm group cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-meaven-blue group-hover:scale-110 transition-transform" />
              <span className="text-slate-400 group-hover:text-slate-200">
                Ask Founder Cockpit anything...
              </span>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-mono text-cockpit-subtle bg-cockpit-card px-2 py-0.5 rounded border border-cockpit-border">
              <Command className="w-3 h-3" />
              <span>K</span>
            </div>
          </button>
        </div>

        {/* Founder Profile & Logout */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-cockpit-surface border border-cockpit-border rounded-lg text-xs text-slate-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-medium">Protected Engine</span>
          </div>

          <div className="flex items-center gap-2.5 pl-2 border-l border-cockpit-border">
            <div className="w-8 h-8 rounded-full bg-meaven-blue/20 border border-meaven-blue/50 flex items-center justify-center text-meaven-blue font-bold text-xs">
              R
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-200">Ravi</span>
              <span className="text-[10px] text-cockpit-muted">Founder & CEO</span>
            </div>

            <button
              onClick={handleLogout}
              title="Log out of Cockpit"
              className="ml-2 p-1.5 text-cockpit-subtle hover:text-rose-400 hover:bg-rose-500/10 rounded-lg border border-transparent hover:border-rose-500/30 transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Command Bar Modal */}
      <AICommandBar
        isOpen={isCommandBarOpen}
        onClose={() => setIsCommandBarOpen(false)}
      />
    </>
  );
};
