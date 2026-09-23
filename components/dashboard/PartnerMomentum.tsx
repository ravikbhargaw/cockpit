'use client';

import React from 'react';
import { Target, Award, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';

interface PartnerMomentumProps {
  activeCount?: number;
  targetCount?: number;
  headline?: string;
  subtext?: string;
}

export const PartnerMomentum: React.FC<PartnerMomentumProps> = ({
  activeCount = 2,
  targetCount = 5,
  headline,
  subtext = 'Build your first five strategic partner relationships.',
}) => {
  const displayHeadline = headline || `${activeCount} / ${targetCount} Active Partners`;
  const pct = Math.min(100, Math.round((activeCount / targetCount) * 100));

  return (
    <div className="cockpit-card p-5 relative overflow-hidden flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-meaven-blue/15 rounded-lg text-meaven-blue">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-semibold text-cockpit-muted uppercase tracking-wider block">
              Partner Momentum
            </span>
            <span className="text-xs text-cockpit-subtle">Calculated DB Metric</span>
          </div>
        </div>
        <Link
          href="/relationships"
          className="text-xs text-meaven-blue hover:text-meaven-light flex items-center gap-0.5 font-medium transition-colors"
        >
          View Partners <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="my-2">
        <div className="flex items-baseline gap-2 mb-3">
          <h2 className="text-2xl font-extrabold text-slate-100 tracking-tight font-mono">
            {displayHeadline}
          </h2>
          <span className="text-xs text-emerald-400 font-medium px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded font-mono">
            {pct}% Milestone
          </span>
        </div>

        {/* Visual Dot Indicator ● ● ○ ○ ○ */}
        <div className="flex items-center gap-2.5 my-3">
          {Array.from({ length: targetCount }).map((_, idx) => {
            const isActive = idx < activeCount;
            return (
              <div
                key={idx}
                className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                  isActive
                    ? 'bg-meaven-blue text-white shadow-glow-meaven ring-2 ring-meaven-blue/40'
                    : 'bg-cockpit-surface border border-cockpit-border text-cockpit-subtle'
                }`}
              >
                {isActive ? (
                  <Award className="w-3.5 h-3.5" />
                ) : (
                  <span className="text-[10px] font-mono">{idx + 1}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-2 pt-3 border-t border-cockpit-border flex items-center justify-between text-xs text-cockpit-muted">
        <p className="font-medium text-slate-300">{subtext}</p>
        <span className="text-[11px] text-cockpit-subtle font-mono">
          {Math.max(0, targetCount - activeCount)} to go
        </span>
      </div>
    </div>
  );
};
