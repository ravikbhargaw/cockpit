'use client';

import React from 'react';
import { Flame, ArrowRight, Building2, CheckCircle2, Calendar, Target, Award, Sparkles } from 'lucide-react';
import Link from 'next/link';

export interface PriorityItemProps {
  id: string;
  category?: 'OVERDUE' | 'TODAY' | 'RESEARCH_REVIEW' | 'OPPORTUNITY' | 'RELATIONSHIP' | 'OUTREACH' | 'FOUNDER180';
  companyId?: string;
  companyName: string;
  title?: string;
  reason: string;
  priority: 'High' | 'Medium';
  suggestedAction: string;
  dueText: string;
  targetUrl?: string;
}

export interface UpcomingItemProps {
  id: string;
  companyId: string;
  companyName: string;
  title: string;
  date: string;
  targetUrl: string;
}

interface TodayPrioritiesProps {
  priorities?: PriorityItemProps[];
  upNext?: UpcomingItemProps[];
  onActionClick?: (companyId: string, actionName: string) => void;
}

export const TodayPriorities: React.FC<TodayPrioritiesProps> = ({
  priorities = [],
  upNext = [],
  onActionClick,
}) => {
  const getBadgeStyle = (category?: string, priority?: string) => {
    switch (category) {
      case 'OVERDUE':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      case 'TODAY':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'RESEARCH_REVIEW':
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30';
      case 'OPPORTUNITY':
        return 'bg-sky-500/10 text-sky-400 border-sky-500/30';
      case 'RELATIONSHIP':
      case 'OUTREACH':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'FOUNDER180':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      default:
        return priority === 'High'
          ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
          : 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    }
  };

  const getCategoryLabel = (item: PriorityItemProps) => {
    switch (item.category) {
      case 'OVERDUE':
        return 'OVERDUE';
      case 'TODAY':
        return 'DUE TODAY';
      case 'RESEARCH_REVIEW':
        return 'FOUNDER DECISION';
      case 'OPPORTUNITY':
        return 'DEAL ATTENTION';
      case 'RELATIONSHIP':
        return 'RELATIONSHIP';
      case 'OUTREACH':
        return 'OUTREACH READY';
      case 'FOUNDER180':
        return 'FOUNDER 180';
      default:
        return item.priority.toUpperCase();
    }
  };

  return (
    <div className="cockpit-panel p-5 flex flex-col justify-between h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-amber-500/15 rounded-lg text-amber-400">
            <Flame className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
              Today&apos;s Founder Priorities
            </h3>
            <span className="text-xs text-cockpit-muted">Action items requiring founder attention</span>
          </div>
        </div>
        <span className="text-xs font-mono px-2 py-0.5 bg-cockpit-surface border border-cockpit-border text-cockpit-muted rounded">
          {priorities.length} Priority Items
        </span>
      </div>

      <div className="space-y-3 flex-1">
        {priorities.length === 0 ? (
          <div className="p-6 bg-cockpit-card/60 border border-cockpit-border rounded-lg text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500/15 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-200">You&apos;re clear for today.</h4>
              <p className="text-xs text-cockpit-muted mt-1">
                No overdue actions or pending founder decisions.
              </p>
            </div>

            {upNext.length > 0 && (
              <div className="pt-4 border-t border-cockpit-border/60 text-left">
                <span className="text-[11px] font-bold uppercase tracking-wider text-meaven-blue block mb-2 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> Up Next
                </span>
                <div className="space-y-2">
                  {upNext.map((item) => (
                    <Link
                      key={item.id}
                      href={item.targetUrl}
                      className="p-2.5 bg-cockpit-surface border border-cockpit-border hover:border-meaven-blue/40 rounded flex items-center justify-between text-xs transition group"
                    >
                      <div className="truncate">
                        <span className="font-semibold text-slate-200 group-hover:text-meaven-light">
                          {item.companyName}
                        </span>
                        <span className="text-cockpit-subtle ml-2 truncate font-mono">
                          {item.title}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-meaven-blue px-2 py-0.5 bg-meaven-blue/10 rounded shrink-0">
                        {item.date}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          priorities.map((item) => {
            const destination = item.targetUrl || (item.companyId ? `/relationships?companyId=${item.companyId}` : '/relationships');

            return (
              <div
                key={item.id}
                className="p-4 bg-cockpit-card border border-cockpit-border hover:border-meaven-blue/40 rounded-lg transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-cockpit-surface border border-cockpit-border flex items-center justify-center text-meaven-blue font-bold text-xs shrink-0 mt-0.5">
                    <Building2 className="w-4 h-4" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-sm font-bold text-slate-100 group-hover:text-meaven-light transition-colors">
                        {item.title || item.companyName}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${getBadgeStyle(
                          item.category,
                          item.priority
                        )}`}
                      >
                        {getCategoryLabel(item)}
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
                    href={destination}
                    onClick={() => onActionClick && item.companyId && onActionClick(item.companyId, item.suggestedAction)}
                    className="px-3 py-1.5 bg-meaven-blue hover:bg-meaven-hover text-white text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 shadow-sm"
                  >
                    <span>{item.suggestedAction}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
