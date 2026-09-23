'use client';

import React from 'react';
import { BrainCircuit, Sparkles, TrendingUp, ShieldCheck, ArrowRight, Lightbulb } from 'lucide-react';
import { mockCompanies, mockIntelligence, mockRelationships } from '@/lib/mockData';
import Link from 'next/link';

export default function IntelligencePage() {
  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="cockpit-panel p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <BrainCircuit className="w-4 h-4 text-meaven-blue" />
              <span className="text-xs font-bold uppercase tracking-wider text-meaven-blue">
                AI Relationship Diagnostics
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-100">Intelligence Engine</h1>
            <p className="text-xs text-cockpit-muted mt-1 max-w-2xl">
              AI-generated account insights, health scores, and automated relationship nurturing recommendations.
            </p>
          </div>

          <div className="p-3 bg-meaven-blue/10 border border-meaven-blue/30 rounded-lg text-xs font-mono text-meaven-light">
            <span>Model Readiness: <strong>Server Endpoint Prepared</strong></span>
          </div>
        </div>
      </div>

      {/* Account Intelligence Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.values(mockIntelligence).map((intel) => {
          const comp = mockCompanies.find((c) => c.id === intel.companyId);
          const rel = mockRelationships.find((r) => r.companyId === intel.companyId);

          return (
            <div key={intel.id} className="cockpit-card p-6 space-y-4 border border-cockpit-border hover:border-meaven-blue/40">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-100">{comp?.name}</h3>
                  <span className="text-xs text-cockpit-muted font-mono">{comp?.type} • {comp?.city}</span>
                </div>

                <div className="p-3 bg-cockpit-bg border border-cockpit-border rounded-lg text-right font-mono">
                  <div className="text-[10px] text-cockpit-subtle uppercase">Health Index</div>
                  <div className="text-lg font-extrabold text-emerald-400">{intel.healthScore} / 100</div>
                </div>
              </div>

              <div className="p-4 bg-meaven-blue/10 border border-meaven-blue/30 rounded-lg space-y-1">
                <div className="text-xs font-bold text-meaven-light flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-meaven-blue" />
                  <span>AI Strategic Recommendation</span>
                </div>
                <p className="text-xs font-medium text-slate-200 leading-relaxed">
                  {intel.recommendation}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs font-mono pt-2 border-t border-cockpit-border">
                <div>
                  <span className="text-cockpit-subtle block">Growth Potential:</span>
                  <span className="text-emerald-400 font-bold">{intel.growthPotential}</span>
                </div>
                <div>
                  <span className="text-cockpit-subtle block">Nurture Cadence:</span>
                  <span className="text-slate-200 font-medium">{intel.nurtureCadence}</span>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <Link
                  href={`/relationships?companyId=${intel.companyId}`}
                  className="text-xs text-meaven-blue hover:underline font-semibold flex items-center gap-1"
                >
                  <span>Open Account View</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
