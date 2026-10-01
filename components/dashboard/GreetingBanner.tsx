'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Sparkles, Database } from 'lucide-react';
import { formatDisplayDate } from '@/lib/utils';

interface GreetingBannerProps {
  subtitle?: string;
}

export const GreetingBanner: React.FC<GreetingBannerProps> = ({ subtitle }) => {
  const [formattedDate, setFormattedDate] = useState<string>('');

  useEffect(() => {
    const now = new Date();
    const weekday = now.toLocaleDateString('en-US', { weekday: 'long' });
    setFormattedDate(`${weekday}, ${formatDisplayDate(now)}`);
  }, []);

  const displaySubtitle = subtitle || "Here's what deserves your attention today.";

  return (
    <div className="cockpit-panel p-6 bg-gradient-to-r from-cockpit-surface via-cockpit-surface to-meaven-blue/10 relative overflow-hidden">
      <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-meaven-blue/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-meaven-blue flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Founder Daily Briefing
            </span>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded flex items-center gap-1">
              <Database className="w-3 h-3" /> Live Cockpit Data
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 tracking-tight">
            Good morning, Ravi.
          </h1>
          <p className="text-sm text-slate-300 mt-1 font-medium">
            {displaySubtitle}
          </p>
        </div>

        {formattedDate && (
          <div className="flex items-center gap-2 px-3.5 py-2 bg-cockpit-bg/60 border border-cockpit-border rounded-lg text-xs font-medium text-slate-300 self-start sm:self-center">
            <Calendar className="w-4 h-4 text-meaven-blue" />
            <span>{formattedDate}</span>
          </div>
        )}
      </div>
    </div>
  );
};
