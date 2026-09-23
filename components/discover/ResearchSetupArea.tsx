'use client';

import React, { useState, useEffect } from 'react';
import { Target, Sliders, Save, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { ResearchSetup } from '@/types';

export const ResearchSetupArea: React.FC = () => {
  const [setup, setSetup] = useState<ResearchSetup>({
    targetCompanyType: 'Boutique Interior Design Firm',
    geography: 'Bangalore',
    industry: 'Commercial / Office Interiors',
    companySize: '5-50',
    services: 'Design + D&B',
    keywords: 'workspace, office interiors',
    website: '',
    notes: '',
    updatedAt: new Date().toISOString(),
  });

  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  const fetchSetup = async () => {
    try {
      const res = await fetch('/api/discover/setup');
      if (res.ok) {
        const json = await res.json();
        setSetup(json);
      }
    } catch {
      console.error('Failed to load research setup');
    }
  };

  useEffect(() => {
    fetchSetup();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch('/api/discover/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(setup),
      });
      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch {
      alert('Failed to save research target setup');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="cockpit-panel p-4 sm:p-5 border border-cockpit-border rounded-xl space-y-4">
      <div className="flex items-center justify-between cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-meaven-blue/15 rounded-lg text-meaven-blue">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-100 font-mono">
                Target Research Profile
              </h3>
              <span className="text-[10px] px-2 py-0.5 bg-meaven-blue/10 border border-meaven-blue/30 text-meaven-light rounded font-mono">
                {setup.geography} • {setup.targetCompanyType}
              </span>
            </div>
            <p className="text-[11px] text-cockpit-muted mt-0.5">
              Define target criteria to guide manual &amp; future AI research discovery workflows
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {saveSuccess && (
            <span className="text-xs text-emerald-400 flex items-center gap-1 font-medium font-mono">
              <CheckCircle2 className="w-3.5 h-3.5" /> Saved
            </span>
          )}
          <button
            type="button"
            className="p-1.5 text-cockpit-subtle hover:text-slate-200 bg-cockpit-surface border border-cockpit-border rounded-md text-xs flex items-center gap-1 font-medium"
          >
            <Sliders className="w-3.5 h-3.5 text-meaven-blue" />
            <span>{isExpanded ? 'Hide Setup' : 'Configure Criteria'}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <form onSubmit={handleSave} className="pt-3 border-t border-cockpit-border space-y-4 animate-in fade-in duration-150">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1 font-mono uppercase tracking-wider">
                Target Company Type
              </label>
              <input
                type="text"
                value={setup.targetCompanyType}
                onChange={(e) => setSetup({ ...setup, targetCompanyType: e.target.value })}
                placeholder="e.g. Boutique Interior Design Firm"
                className="w-full px-3 py-1.5 bg-cockpit-bg border border-cockpit-border rounded text-xs text-slate-200 focus:outline-none focus:border-meaven-blue"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1 font-mono uppercase tracking-wider">
                Geography
              </label>
              <input
                type="text"
                value={setup.geography}
                onChange={(e) => setSetup({ ...setup, geography: e.target.value })}
                placeholder="e.g. Bangalore"
                className="w-full px-3 py-1.5 bg-cockpit-bg border border-cockpit-border rounded text-xs text-slate-200 focus:outline-none focus:border-meaven-blue"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1 font-mono uppercase tracking-wider">
                Industry / Specialization
              </label>
              <input
                type="text"
                value={setup.industry}
                onChange={(e) => setSetup({ ...setup, industry: e.target.value })}
                placeholder="e.g. Commercial / Office Interiors"
                className="w-full px-3 py-1.5 bg-cockpit-bg border border-cockpit-border rounded text-xs text-slate-200 focus:outline-none focus:border-meaven-blue"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1 font-mono uppercase tracking-wider">
                Company Size
              </label>
              <input
                type="text"
                value={setup.companySize}
                onChange={(e) => setSetup({ ...setup, companySize: e.target.value })}
                placeholder="e.g. 5-50 employees"
                className="w-full px-3 py-1.5 bg-cockpit-bg border border-cockpit-border rounded text-xs text-slate-200 focus:outline-none focus:border-meaven-blue"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1 font-mono uppercase tracking-wider">
                Relevant Services
              </label>
              <input
                type="text"
                value={setup.services}
                onChange={(e) => setSetup({ ...setup, services: e.target.value })}
                placeholder="e.g. Design + D&B"
                className="w-full px-3 py-1.5 bg-cockpit-bg border border-cockpit-border rounded text-xs text-slate-200 focus:outline-none focus:border-meaven-blue"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1 font-mono uppercase tracking-wider">
                Keywords
              </label>
              <input
                type="text"
                value={setup.keywords}
                onChange={(e) => setSetup({ ...setup, keywords: e.target.value })}
                placeholder="e.g. workspace, office interiors"
                className="w-full px-3 py-1.5 bg-cockpit-bg border border-cockpit-border rounded text-xs text-slate-200 focus:outline-none focus:border-meaven-blue"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-300 block mb-1 font-mono uppercase tracking-wider">
              Research Strategy &amp; Guidance Notes
            </label>
            <textarea
              rows={2}
              value={setup.notes}
              onChange={(e) => setSetup({ ...setup, notes: e.target.value })}
              placeholder="e.g. Focus on design studios managing tech headquarters and high-end workplace turnkeys..."
              className="w-full px-3 py-1.5 bg-cockpit-bg border border-cockpit-border rounded text-xs text-slate-200 focus:outline-none focus:border-meaven-blue"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-1.5 bg-meaven-blue hover:bg-meaven-hover text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving Profile...' : 'Save Profile Setup'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
