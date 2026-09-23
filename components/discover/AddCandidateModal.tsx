'use client';

import React, { useState } from 'react';
import { X, Compass, Globe, MapPin, Building2, Link as LinkIcon } from 'lucide-react';

interface AddCandidateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddCandidateModal: React.FC<AddCandidateModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [form, setForm] = useState({
    companyName: '',
    website: '',
    companyType: 'Architecture',
    location: 'Mumbai',
    industry: 'Commercial Interiors',
    source: 'Founder Research',
    sourceUrl: '',
    initialNote: '',
    priority: 'MEDIUM' as 'HIGH' | 'MEDIUM' | 'LOW',
    fitScore: 85,
    fitReason: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.companyName.trim()) {
      setError('Company name is required');
      return;
    }
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/discover/candidates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setForm({
          companyName: '',
          website: '',
          companyType: 'Architecture',
          location: 'Mumbai',
          industry: 'Commercial Interiors',
          source: 'Founder Research',
          sourceUrl: '',
          initialNote: '',
          priority: 'MEDIUM',
          fitScore: 85,
          fitReason: '',
        });
        onSuccess();
        onClose();
      } else {
        const json = await res.json();
        setError(json.error || 'Failed to add candidate');
      }
    } catch {
      setError('Connection error while adding candidate');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-cockpit-surface border border-cockpit-border rounded-xl shadow-2xl p-6 relative space-y-4">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-cockpit-muted hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 border-b border-cockpit-border pb-3">
          <div className="p-2 bg-meaven-blue/15 rounded-lg text-meaven-blue">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100 font-mono uppercase tracking-wider">
              Add Research Candidate
            </h3>
            <p className="text-xs text-cockpit-muted">
              Register a new organization for investigation &amp; qualification
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-xs text-rose-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1 font-mono uppercase tracking-wider">
              Company Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Studio Format Architecture"
              value={form.companyName}
              onChange={(e) => setForm({ ...form, companyName: e.target.value })}
              className="w-full px-3 py-2 bg-cockpit-bg border border-cockpit-border rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-meaven-blue"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1 font-mono uppercase tracking-wider">
                Website / Domain
              </label>
              <div className="relative">
                <Globe className="w-3.5 h-3.5 text-cockpit-subtle absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="https://studioformat.in"
                  value={form.website}
                  onChange={(e) => setForm({ ...form, website: e.target.value })}
                  className="w-full pl-8 pr-3 py-2 bg-cockpit-bg border border-cockpit-border rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-meaven-blue font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1 font-mono uppercase tracking-wider">
                Location / City
              </label>
              <div className="relative">
                <MapPin className="w-3.5 h-3.5 text-cockpit-subtle absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Bengaluru"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  className="w-full pl-8 pr-3 py-2 bg-cockpit-bg border border-cockpit-border rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-meaven-blue"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1 font-mono uppercase tracking-wider">
                Company Type
              </label>
              <select
                value={form.companyType}
                onChange={(e) => setForm({ ...form, companyType: e.target.value, industry: e.target.value })}
                className="w-full px-3 py-2 bg-cockpit-bg border border-cockpit-border rounded-lg text-xs text-slate-100 focus:outline-none focus:border-meaven-blue"
              >
                <option value="Architecture">Architecture</option>
                <option value="Interior Design">Interior Design</option>
                <option value="Turnkey D&B">Turnkey D&B</option>
                <option value="Real Estate Developer">Real Estate Developer</option>
                <option value="Design Consultancy">Design Consultancy</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1 font-mono uppercase tracking-wider">
                Initial Priority
              </label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value as any })}
                className="w-full px-3 py-2 bg-cockpit-bg border border-cockpit-border rounded-lg text-xs text-slate-100 focus:outline-none focus:border-meaven-blue"
              >
                <option value="HIGH">HIGH Priority</option>
                <option value="MEDIUM">MEDIUM Priority</option>
                <option value="LOW">LOW Priority</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1 font-mono uppercase tracking-wider">
                Discovery Source
              </label>
              <input
                type="text"
                placeholder="e.g. Founder Research, Referral"
                value={form.source}
                onChange={(e) => setForm({ ...form, source: e.target.value })}
                className="w-full px-3 py-2 bg-cockpit-bg border border-cockpit-border rounded-lg text-xs text-slate-100 focus:outline-none focus:border-meaven-blue"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1 font-mono uppercase tracking-wider">
                Source URL (Optional)
              </label>
              <div className="relative">
                <LinkIcon className="w-3.5 h-3.5 text-cockpit-subtle absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="https://..."
                  value={form.sourceUrl}
                  onChange={(e) => setForm({ ...form, sourceUrl: e.target.value })}
                  className="w-full pl-8 pr-3 py-2 bg-cockpit-bg border border-cockpit-border rounded-lg text-xs text-slate-100 font-mono placeholder-slate-500 focus:outline-none focus:border-meaven-blue"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1 font-mono uppercase tracking-wider">
              Initial Research Note / Summary
            </label>
            <textarea
              rows={3}
              placeholder="Record initial findings, key projects, or why this company is relevant..."
              value={form.initialNote}
              onChange={(e) => setForm({ ...form, initialNote: e.target.value })}
              className="w-full px-3 py-2 bg-cockpit-bg border border-cockpit-border rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-meaven-blue"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-cockpit-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-cockpit-bg hover:bg-cockpit-surface text-xs font-semibold text-slate-300 rounded-lg border border-cockpit-border transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-meaven-blue hover:bg-meaven-hover text-white text-xs font-semibold rounded-lg transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? 'Saving Candidate...' : 'Save Candidate'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
