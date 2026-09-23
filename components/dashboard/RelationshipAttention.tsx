'use client';

import React from 'react';
import { AlertCircle, Clock, ArrowRight, UserCheck } from 'lucide-react';
import Link from 'next/link';

interface AttentionItem {
  id: string;
  companyId: string;
  companyName: string;
  companyType: string;
  daysInactive: number;
  nextAction: string;
  nextActionDate: string;
  temperature: string;
}

interface RelationshipAttentionProps {
  attention?: AttentionItem[];
}

export const RelationshipAttention: React.FC<RelationshipAttentionProps> = ({ attention = [] }) => {
  return (
    <div className="cockpit-panel p-4 sm:p-5 flex flex-col justify-between">
      {/* Panel Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-meaven-blue/15 rounded-lg text-meaven-blue">
            <AlertCircle className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider font-mono">
              Relationship Attention
            </h3>
            <span className="text-[11px] text-cockpit-muted">Accounts requiring proactive founder touchpoints</span>
          </div>
        </div>
        <Link
          href="/relationships"
          className="text-xs text-meaven-blue hover:text-meaven-light flex items-center gap-1 font-medium transition-colors"
        >
          View All <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* List Container */}
      <div className="space-y-2">
        {attention.length === 0 ? (
          <div className="py-6 text-center text-xs text-cockpit-muted border border-dashed border-cockpit-border rounded-lg">
            No accounts currently flag for relationship attention.
          </div>
        ) : (
          attention.map((item) => (
            <div
              key={item.id}
              className="px-3 py-2.5 bg-cockpit-card border border-cockpit-border hover:border-meaven-blue/40 rounded-lg transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4 group"
            >
              {/* Horizontal Content Flow: [Status Dot] [Company + Type] [Inactive Duration] [Next Action] */}
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                {/* 1. Status Indicator Dot */}
                <div
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    item.temperature === 'Stale'
                      ? 'bg-rose-400'
                      : item.temperature === 'Warm'
                      ? 'bg-amber-400'
                      : 'bg-emerald-400'
                  }`}
                  title={`Status: ${item.temperature}`}
                />

                {/* 2. Company Name & Type Badge */}
                <div className="flex items-center gap-2 shrink-0 max-w-[160px] sm:max-w-[190px]">
                  <span className="text-xs sm:text-sm font-bold text-slate-100 group-hover:text-meaven-light transition-colors truncate">
                    {item.companyName}
                  </span>
                  <span className="text-[10px] text-cockpit-subtle px-1.5 py-0.5 bg-cockpit-surface border border-cockpit-border rounded shrink-0 font-medium">
                    {item.companyType}
                  </span>
                </div>

                {/* Separator */}
                <span className="text-cockpit-border/60 text-xs hidden md:inline shrink-0">•</span>

                {/* 3. Inactive Duration (One Line) */}
                <span className="text-[11px] font-mono text-slate-400 shrink-0 whitespace-nowrap flex items-center gap-1">
                  <Clock className="w-3 h-3 text-meaven-blue shrink-0" />
                  <span>{item.daysInactive} days inactive</span>
                </span>

                {/* Separator */}
                <span className="text-cockpit-border/60 text-xs hidden lg:inline shrink-0">•</span>

                {/* 4. Reason / Next Action (Truncates gracefully with ellipsis) */}
                <span className="text-xs text-cockpit-subtle truncate min-w-0 hidden sm:inline flex-1">
                  {item.nextAction}
                </span>
              </div>

              {/* 5. Review Account Button (Aligned Right & Vertically Centered) */}
              <Link
                href={`/relationships?companyId=${item.companyId}`}
                className="px-2.5 py-1 text-xs font-semibold text-meaven-blue bg-meaven-blue/10 hover:bg-meaven-blue/20 border border-meaven-blue/30 rounded transition-colors shrink-0 flex items-center justify-center gap-1.5 self-start sm:self-auto ml-auto"
              >
                <UserCheck className="w-3 h-3" />
                <span>Review Account</span>
              </Link>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
