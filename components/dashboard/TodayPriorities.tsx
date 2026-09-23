'use client';

import React from 'react';
import { Flame, ArrowRight, Building2 } from 'lucide-react';
import Link from 'next/link';

interface PriorityItemProps {
  id: string;
  companyId: string;
  companyName: string;
  reason: string;
  priority: 'High' | 'Medium';
  suggestedAction: string;
  dueText: string;
}

interface TodayPrioritiesProps {
  priorities?: PriorityItemProps[];
  onActionClick?: (companyId: string, actionName: string) => void;
}

export const TodayPriorities: React.FC<TodayPrioritiesProps> = ({ priorities = [], onActionClick }) => {
  return (
    <div className="cockpit-panel p-5 flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-amber-500/15 rounded-lg text-amber-400">
            <Flame className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
              Today&apos;s Priorities
            </h3>
            <span className="text-xs text-cockpit-muted">Action items calculated from SQLite</span>
          </div>
        </div>
        <span className="text-xs font-mono px-2 py-0.5 bg-cockpit-surface border border-cockpit-border text-cockpit-muted rounded">
          {priorities.length} Active Items
        </span>
      </div>

      <div className="space-y-3">
        {priorities.length === 0 ? (
          <div className="py-8 text-center text-xs text-cockpit-muted border border-dashed border-cockpit-border rounded-lg">
            No urgent priorities due today. Everything is up to date!
          </div>
        ) : (
          priorities.map((item) => (
            <div
              key={item.id}
              className="p-4 bg-cockpit-card border border-cockpit-border hover:border-meaven-blue/40 rounded-lg transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
            >
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-cockpit-surface border border-cockpit-border flex items-center justify-center text-meaven-blue font-bold text-xs shrink-0 mt-0.5">
                  <Building2 className="w-4 h-4" />
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold text-slate-100 group-hover:text-meaven-light transition-colors">
                      {item.companyName}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                        item.priority === 'High'
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      }`}
                    >
                      {item.priority}
                    </span>
                    <span className="text-[11px] text-cockpit-subtle font-mono">{item.dueText}</span>
                  </div>
                  <p className="text-xs text-cockpit-muted leading-relaxed">
                    {item.reason}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                <Link
                  href={`/relationships?companyId=${item.companyId}`}
                  onClick={() => onActionClick && onActionClick(item.companyId, item.suggestedAction)}
                  className="px-3 py-1.5 bg-meaven-blue hover:bg-meaven-hover text-white text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <span>{item.suggestedAction}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
