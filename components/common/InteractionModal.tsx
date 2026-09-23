'use client';

import React, { useState, useEffect } from 'react';
import { MessageSquarePlus, X, CheckCircle2 } from 'lucide-react';

interface InteractionModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCompanyId?: string;
  onSuccess?: () => void;
}

export const InteractionModal: React.FC<InteractionModalProps> = ({
  isOpen,
  onClose,
  defaultCompanyId,
  onSuccess,
}) => {
  const [companiesList, setCompaniesList] = useState<{ id: string; name: string }[]>([]);
  const [formSubmitted, setFormSubmitted] = useState(false);

  const [form, setForm] = useState({
    companyId: defaultCompanyId || '',
    contactName: '',
    channel: 'Meeting',
    date: new Date().toISOString().split('T')[0],
    summary: '',
    whatTheyNeeded: '',
    whatWeLearned: '',
    isDecisionMakerInvolved: true,
    servicesDiscussed: ['Turnkey Fitout'],
    noFurtherAction: false,
    nextAction: '',
    nextActionDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    if (!isOpen) return;

    fetch('/api/companies')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setCompaniesList(data.map((c: any) => ({ id: c.id, name: c.name })));
          if (data.length > 0 && !defaultCompanyId) {
            setForm((prev) => {
              if (!prev.companyId) {
                return { ...prev, companyId: data[0].id };
              }
              return prev;
            });
          }
        }
      })
      .catch(() => {});

    if (defaultCompanyId) {
      setForm((prev) => ({ ...prev, companyId: defaultCompanyId }));
    }
  }, [isOpen, defaultCompanyId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.noFurtherAction && (!form.nextAction || !form.nextActionDate)) {
      alert("Enforcement Rule: Every meaningful interaction requires either 'Next Action + Next Action Date' OR checking 'No Further Action Required'.");
      return;
    }

    try {
      const res = await fetch('/api/interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: form.companyId,
          contactName: form.contactName,
          channel: form.channel,
          date: form.date,
          summary: form.summary,
          whatTheyNeeded: form.whatTheyNeeded,
          whatWeLearned: form.whatWeLearned,
          isDecisionMakerInvolved: form.isDecisionMakerInvolved,
          servicesDiscussed: form.servicesDiscussed,
          noFurtherActionRequired: form.noFurtherAction,
          nextAction: form.nextAction,
          nextActionDate: form.nextActionDate,
        }),
      });

      if (res.ok) {
        setFormSubmitted(true);
        setTimeout(() => {
          setFormSubmitted(false);
          onClose();
          if (onSuccess) onSuccess();
        }, 1000);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to log interaction');
      }
    } catch {
      alert('Failed to log interaction');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-cockpit-surface border border-cockpit-border rounded-xl shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 text-cockpit-muted hover:text-white">
          <X className="w-5 h-5" />
        </button>

        {formSubmitted ? (
          <div className="py-8 text-center flex flex-col items-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mb-3 animate-bounce" />
            <h4 className="text-lg font-bold text-slate-100">Interaction Logged</h4>
            <p className="text-xs text-cockpit-muted mt-1">Saved cleanly to SQLite. Relationship state updated.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-2 border-b border-cockpit-border pb-3">
              <MessageSquarePlus className="w-5 h-5 text-meaven-blue" />
              <div>
                <h4 className="text-base font-bold text-slate-100">Log Meaningful Interaction</h4>
                <p className="text-xs text-cockpit-muted">Enforces mandatory Next Action + Date rule</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Company *</label>
                <select
                  value={form.companyId}
                  onChange={(e) => setForm({ ...form, companyId: e.target.value })}
                  className="w-full px-3 py-2 bg-cockpit-bg border border-cockpit-border rounded text-xs text-slate-200 focus:outline-none focus:border-meaven-blue"
                >
                  {companiesList.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Channel</label>
                <select
                  value={form.channel}
                  onChange={(e) => setForm({ ...form, channel: e.target.value })}
                  className="w-full px-3 py-2 bg-cockpit-bg border border-cockpit-border rounded text-xs text-slate-200 focus:outline-none focus:border-meaven-blue"
                >
                  <option value="Meeting">Meeting</option>
                  <option value="Call">Call</option>
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="Email">Email</option>
                  <option value="Note">Note</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Contact Person Involved</label>
                <input
                  type="text"
                  placeholder="e.g. Ar. Priya Sharma"
                  value={form.contactName}
                  onChange={(e) => setForm({ ...form, contactName: e.target.value })}
                  className="w-full px-3 py-2 bg-cockpit-bg border border-cockpit-border rounded text-xs text-slate-200 focus:outline-none focus:border-meaven-blue"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">What did they need?</label>
                <input
                  type="text"
                  placeholder="e.g. Joinery finishes catalog"
                  value={form.whatTheyNeeded}
                  onChange={(e) => setForm({ ...form, whatTheyNeeded: e.target.value })}
                  className="w-full px-3 py-2 bg-cockpit-bg border border-cockpit-border rounded text-xs text-slate-200 focus:outline-none focus:border-meaven-blue"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Summary & Learnings *</label>
              <textarea
                rows={2}
                required
                placeholder="Key discussion points & what we learned..."
                value={form.summary}
                onChange={(e) => setForm({ ...form, summary: e.target.value, whatWeLearned: e.target.value })}
                className="w-full px-3 py-2 bg-cockpit-bg border border-cockpit-border rounded text-xs text-slate-200 focus:outline-none focus:border-meaven-blue"
              />
            </div>

            <label className="flex items-center gap-2 text-xs text-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isDecisionMakerInvolved}
                onChange={(e) => setForm({ ...form, isDecisionMakerInvolved: e.target.checked })}
                className="rounded border-cockpit-border text-meaven-blue"
              />
              <span>Decision Maker Involved</span>
            </label>

            <div className="p-3 bg-meaven-blue/10 border border-meaven-blue/30 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-meaven-light uppercase tracking-wider">
                  Mandatory Next Step Rule
                </span>
                <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.noFurtherAction}
                    onChange={(e) => setForm({ ...form, noFurtherAction: e.target.checked })}
                    className="rounded border-cockpit-border text-meaven-blue focus:ring-0"
                  />
                  <span>No Further Action Required</span>
                </label>
              </div>

              {!form.noFurtherAction && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">Next Action *</label>
                    <input
                      type="text"
                      required={!form.noFurtherAction}
                      placeholder="Specific required action"
                      value={form.nextAction}
                      onChange={(e) => setForm({ ...form, nextAction: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-cockpit-bg border border-cockpit-border rounded text-xs text-slate-200 focus:outline-none focus:border-meaven-blue"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">Next Action Date *</label>
                    <input
                      type="date"
                      required={!form.noFurtherAction}
                      value={form.nextActionDate}
                      onChange={(e) => setForm({ ...form, nextActionDate: e.target.value })}
                      onClick={(e) => e.currentTarget.showPicker && e.currentTarget.showPicker()}
                      className="w-full px-2.5 py-1.5 bg-cockpit-bg border border-cockpit-border rounded text-xs text-slate-200 focus:outline-none focus:border-meaven-blue cursor-pointer"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button type="button" onClick={onClose} className="px-4 py-2 bg-cockpit-bg border border-cockpit-border hover:bg-cockpit-hover text-xs font-medium text-slate-300 rounded">
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 bg-meaven-blue hover:bg-meaven-hover text-white text-xs font-semibold rounded shadow-sm">
                Save Interaction
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
