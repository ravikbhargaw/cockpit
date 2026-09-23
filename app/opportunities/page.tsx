'use client';

import React, { useState, useEffect } from 'react';
import { Target, Building2, ArrowRight, Plus } from 'lucide-react';
import Link from 'next/link';
import { formatINR } from '@/lib/utils';
import { AddOpportunityModal } from '@/components/common/AddOpportunityModal';

export default function OpportunitiesPage() {
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [isAddOppOpen, setIsAddOppOpen] = useState(false);

  const STAGES = [
    'Qualification',
    'Discovery',
    'Proposal',
    'Negotiation',
    'Closed Won',
    'Closed Lost',
  ];

  const fetchOpps = async () => {
    try {
      const res = await fetch('/api/opportunities');
      if (res.ok) {
        const json = await res.json();
        setOpportunities(json);
      }
    } catch {
      console.error('Failed to fetch opportunities');
    }
  };

  const fetchCompanies = async () => {
    try {
      const res = await fetch('/api/companies');
      if (res.ok) {
        const json = await res.json();
        setCompanies(json);
      }
    } catch {
      console.error('Failed to fetch companies');
    }
  };

  useEffect(() => {
    fetchOpps();
    fetchCompanies();
  }, []);

  const totalValueAmount = opportunities
    .filter((o) => o.stage !== 'Closed Lost')
    .reduce((acc, curr) => acc + (curr.estimatedValueAmount || 0), 0);

  return (
    <div className="space-y-6">
      <AddOpportunityModal
        isOpen={isAddOppOpen}
        companies={companies}
        onClose={() => setIsAddOppOpen(false)}
        onSuccess={() => fetchOpps()}
      />

      {/* Header Banner */}
      <div className="cockpit-panel p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Target className="w-4 h-4 text-meaven-blue" />
              <span className="text-xs font-bold uppercase tracking-wider text-meaven-blue">
                Commercial Pipeline
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-100">Opportunities Board</h1>
            <p className="text-xs text-cockpit-muted mt-1 max-w-2xl">
              Track pre-project deal packages across all 6 commercial stages. Click any opportunity card to open company account detail.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-3 bg-cockpit-surface border border-cockpit-border rounded-lg text-xs font-mono text-emerald-400">
              <span>Active Pipeline Value: <strong>{formatINR(totalValueAmount)}</strong></span>
            </div>
            <button
              onClick={() => setIsAddOppOpen(true)}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-lg flex items-center gap-2 transition shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Add Opportunity</span>
            </button>
          </div>
        </div>
      </div>

      {/* 6-Stage Kanban Board - Horizontal Scrollable Layout for spacious card readability */}
      <div className="flex space-x-4 overflow-x-auto pb-6 scrollbar-thin scrollbar-thumb-cockpit-border scrollbar-track-transparent">
        {STAGES.map((stage) => {
          const stageOpps = opportunities.filter((o) => o.stage === stage);
          const totalVal = stageOpps.reduce((acc, curr) => acc + (curr.estimatedValueAmount || 0), 0);
          const isClosedWon = stage === 'Closed Won';
          const isClosedLost = stage === 'Closed Lost';

          return (
            <div
              key={stage}
              className={`cockpit-panel p-4 bg-cockpit-surface flex flex-col justify-between min-h-[460px] min-w-[280px] sm:min-w-[320px] max-w-[340px] flex-shrink-0 border ${
                isClosedWon
                  ? 'border-emerald-500/30'
                  : isClosedLost
                  ? 'border-rose-500/30'
                  : 'border-cockpit-border'
              }`}
            >
              <div>
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-cockpit-border">
                  <span className={`text-xs font-bold uppercase tracking-wider ${
                    isClosedWon ? 'text-emerald-400' : isClosedLost ? 'text-rose-400' : 'text-slate-200'
                  }`}>
                    {stage}
                  </span>
                  <span className="text-xs font-mono px-2 py-0.5 bg-cockpit-card border border-cockpit-border text-cockpit-muted rounded">
                    {stageOpps.length}
                  </span>
                </div>

                <div className="space-y-3">
                  {stageOpps.length === 0 ? (
                    <div className="py-12 text-center text-xs text-cockpit-subtle border border-dashed border-cockpit-border rounded-lg">
                      No deals in {stage}
                    </div>
                  ) : (
                    stageOpps.map((opp) => (
                      <Link
                        key={opp.id}
                        href={`/relationships?companyId=${opp.companyId}&tab=opportunities&opportunityId=${opp.id}`}
                        className="block group"
                      >
                        <div className="cockpit-card p-3.5 space-y-2.5 border border-cockpit-border hover:border-meaven-blue group-hover:bg-cockpit-hover transition-all cursor-pointer shadow-sm">
                          <div className="flex items-center justify-between text-xs text-meaven-light font-medium">
                            <div className="flex items-center gap-1.5">
                              <Building2 className="w-3.5 h-3.5 text-meaven-blue" />
                              <span className="font-semibold text-slate-200">{opp.companyName || 'Partner'}</span>
                            </div>
                            <ArrowRight className="w-3.5 h-3.5 text-cockpit-subtle group-hover:text-meaven-blue group-hover:translate-x-1 transition-transform" />
                          </div>

                          <h4 className="text-xs font-bold text-slate-100 group-hover:text-meaven-light leading-snug">
                            {opp.title}
                          </h4>

                          <div className="pt-2 border-t border-cockpit-border/80 flex items-center justify-between font-mono">
                            <span className="text-sm font-bold text-emerald-400">
                              {formatINR(opp.estimatedValueAmount)}
                            </span>
                            <span className="text-[10px] text-meaven-blue group-hover:underline">
                              View Account →
                            </span>
                          </div>

                          {opp.nextAction && (
                            <div className="text-[10px] text-cockpit-subtle font-mono pt-1 line-clamp-1">
                              Next: {opp.nextAction} ({opp.nextActionDate})
                            </div>
                          )}
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              </div>

              {totalVal > 0 && (
                <div className="mt-4 pt-3 border-t border-cockpit-border text-right text-xs font-mono text-cockpit-muted">
                  Stage Total: <strong className="text-slate-200">{formatINR(totalVal)}</strong>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
