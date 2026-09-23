'use client';

import React from 'react';
import { Award, Target, TrendingUp, Clock, AlertTriangle } from 'lucide-react';

interface KPIs {
  activePartners?: number;
  openOpportunities?: number;
  pipelineValueFormatted?: string;
  followupsDue?: number;
  overdueFollowups?: number;
  staleRelationships?: number;
}

export const PipelineSnapshot: React.FC<{ kpis?: KPIs }> = ({ kpis = {} }) => {
  const kpiItems = [
    {
      label: 'Active Partners',
      value: kpis.activePartners ?? 0,
      subtext: 'Strategic relationships',
      icon: Award,
      color: 'text-meaven-blue',
      bgColor: 'bg-meaven-blue/15',
    },
    {
      label: 'Open Opportunities',
      value: kpis.openOpportunities ?? 0,
      subtext: 'Deals in qualification/proposal',
      icon: Target,
      color: 'text-sky-400',
      bgColor: 'bg-sky-500/15',
    },
    {
      label: 'Pipeline Value',
      value: kpis.pipelineValueFormatted ?? '₹0',
      subtext: 'Estimated total open value',
      icon: TrendingUp,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/15',
    },
    {
      label: 'Follow-ups Due Today',
      value: kpis.followupsDue ?? 0,
      subtext: 'Action required today',
      icon: Clock,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/15',
    },
    {
      label: 'Stale Relationships',
      value: kpis.staleRelationships ?? 0,
      subtext: '>20 days inactive',
      icon: AlertTriangle,
      color: 'text-rose-400',
      bgColor: 'bg-rose-500/15',
    },
  ];

  return (
    <div className="cockpit-panel p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
            Pipeline Snapshot
          </h3>
          <span className="text-xs text-cockpit-muted">Executive SQLite database metrics</span>
        </div>
        <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" /> Live DB Pulse
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {kpiItems.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="p-3.5 bg-cockpit-card border border-cockpit-border rounded-lg flex flex-col justify-between hover:border-cockpit-borderMuted transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-cockpit-muted font-medium truncate">{item.label}</span>
                <div className={`p-1.5 rounded ${item.bgColor} ${item.color}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </div>

              <div>
                <div className="text-xl font-extrabold text-slate-100 font-mono tracking-tight">
                  {item.value}
                </div>
                <div className="text-[10px] text-cockpit-subtle mt-0.5 truncate">{item.subtext}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
