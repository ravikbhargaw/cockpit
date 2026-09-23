'use client';

import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Layers, Award, Clock, User, CheckCircle2 } from 'lucide-react';

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<'profile' | 'stages' | 'scoring' | 'rules'>('profile');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const [settings, setSettings] = useState<any>({
    founderName: 'Ravi',
    founderRole: 'Founder & CEO',
    commercialWeight: 40,
    qualityWeight: 35,
    staleDays: 20,
    targetPartners: 5,
  });

  useEffect(() => {
    fetch('/api/settings')
      .then((res) => res.json())
      .then((json) => {
        if (json && Object.keys(json).length > 0) {
          setSettings((prev: any) => ({ ...prev, ...json }));
        }
      })
      .catch(() => {});
  }, []);

  const handleSaveSettings = async () => {
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      }
    } catch {
      alert('Failed to save settings');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="cockpit-panel p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <SettingsIcon className="w-4 h-4 text-meaven-blue" />
              <span className="text-xs font-bold uppercase tracking-wider text-meaven-blue">
                Business Configuration
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-100">Founder Cockpit Settings</h1>
            <p className="text-xs text-cockpit-muted mt-1 max-w-2xl">
              Configure business rules, partner scoring criteria, service offerings, follow-up cadences, and research preferences.
            </p>
          </div>

          {savedSuccess && (
            <div className="px-3 py-1.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold rounded-lg flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>Settings Saved to SQLite</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Navigation Sidebar */}
        <div className="space-y-1">
          {[
            { id: 'profile', label: 'Founder Profile', icon: User },
            { id: 'stages', label: 'Relationship Stages', icon: Layers },
            { id: 'scoring', label: 'Partner Scoring Criteria', icon: Award },
            { id: 'rules', label: 'Follow-up & Research Rules', icon: Clock },
          ].map((sec) => {
            const Icon = sec.icon;
            const isActive = activeSection === sec.id;
            return (
              <button
                key={sec.id}
                onClick={() => setActiveSection(sec.id as any)}
                className={`w-full flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-meaven-blue text-white shadow-glow-meaven'
                    : 'text-cockpit-muted hover:text-slate-200 bg-cockpit-surface border border-cockpit-border'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{sec.label}</span>
              </button>
            );
          })}
        </div>

        {/* Configuration Details Panel */}
        <div className="md:col-span-3 cockpit-panel p-6 space-y-6">
          {activeSection === 'profile' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-slate-100 border-b border-cockpit-border pb-3">
                Founder Profile
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Founder Name</label>
                  <input
                    type="text"
                    value={settings.founderName}
                    onChange={(e) => setSettings({ ...settings, founderName: e.target.value })}
                    className="w-full px-3 py-2 bg-cockpit-bg border border-cockpit-border rounded text-xs text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Role Title</label>
                  <input
                    type="text"
                    value={settings.founderRole}
                    onChange={(e) => setSettings({ ...settings, founderRole: e.target.value })}
                    className="w-full px-3 py-2 bg-cockpit-bg border border-cockpit-border rounded text-xs text-slate-200"
                  />
                </div>
              </div>
            </div>
          )}

          {activeSection === 'stages' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-slate-100 border-b border-cockpit-border pb-3">
                Relationship Lifecycle Stages
              </h3>
              <div className="space-y-2 text-xs font-mono">
                {[
                  'Research Candidate',
                  'Prospect',
                  'Qualified',
                  'Contacted',
                  'Meeting Scheduled',
                  'Active Opportunity',
                  'First Project Won',
                  'Active Partner',
                  'Strategic Partner',
                ].map((st, idx) => (
                  <div key={idx} className="p-3 bg-cockpit-bg border border-cockpit-border rounded flex items-center justify-between">
                    <span className="text-slate-200">{idx + 1}. {st}</span>
                    <span className="text-[10px] text-emerald-400 uppercase font-bold">Standard Stage</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSection === 'scoring' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-slate-100 border-b border-cockpit-border pb-3">
                Partner Scoring Parameters
              </h3>
              <div className="space-y-3">
                <div className="p-4 bg-cockpit-bg border border-cockpit-border rounded-lg space-y-2">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-200">Commercial Alignment Weight</span>
                    <span className="text-meaven-blue font-mono">{settings.commercialWeight}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={settings.commercialWeight}
                    onChange={(e) => setSettings({ ...settings, commercialWeight: Number(e.target.value) })}
                    className="w-full accent-meaven-blue"
                  />
                </div>
                <div className="p-4 bg-cockpit-bg border border-cockpit-border rounded-lg space-y-2">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-200">Execution Quality Reputation Weight</span>
                    <span className="text-meaven-blue font-mono">{settings.qualityWeight}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={settings.qualityWeight}
                    onChange={(e) => setSettings({ ...settings, qualityWeight: Number(e.target.value) })}
                    className="w-full accent-meaven-blue"
                  />
                </div>
              </div>
            </div>
          )}

          {activeSection === 'rules' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-slate-100 border-b border-cockpit-border pb-3">
                Follow-up & Inactivity Rules
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Stale Relationship Threshold (Days)</label>
                  <input
                    type="number"
                    value={settings.staleDays}
                    onChange={(e) => setSettings({ ...settings, staleDays: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-cockpit-bg border border-cockpit-border rounded text-xs text-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Target Active Strategic Partners Goal</label>
                  <input
                    type="number"
                    value={settings.targetPartners}
                    onChange={(e) => setSettings({ ...settings, targetPartners: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-cockpit-bg border border-cockpit-border rounded text-xs text-slate-200 font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-cockpit-border flex justify-end">
            <button
              onClick={handleSaveSettings}
              className="px-4 py-2 bg-meaven-blue hover:bg-meaven-hover text-white text-xs font-semibold rounded shadow-sm"
            >
              Save Configuration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
