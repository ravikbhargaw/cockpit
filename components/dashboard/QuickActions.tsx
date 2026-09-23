'use client';

import React, { useState, useEffect } from 'react';
import { Compass, PlusCircle, MessageSquarePlus, Target, Sparkles, X, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { AICommandBar } from '@/components/shell/AICommandBar';

interface QuickActionsProps {
  onSuccess?: () => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({ onSuccess }) => {
  const router = useRouter();
  const [activeModal, setActiveModal] = useState<'company' | 'interaction' | 'opportunity' | null>(null);
  const [isCommandBarOpen, setIsCommandBarOpen] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [companiesList, setCompaniesList] = useState<{ id: string; name: string }[]>([]);

  // Form states
  const [companyForm, setCompanyForm] = useState({
    name: '',
    type: 'Interior Design',
    city: 'Mumbai',
    domain: '',
    employeeCount: '10-25',
  });

  const [interactionForm, setInteractionForm] = useState({
    companyId: '',
    channel: 'Meeting',
    contactName: '',
    summary: '',
    whatTheyNeeded: '',
    whatWeLearned: '',
    isDecisionMakerInvolved: true,
    servicesDiscussed: ['Turnkey Fitout'],
    noFurtherAction: false,
    nextAction: '',
    nextActionDate: new Date().toISOString().split('T')[0],
  });

  const [opportunityForm, setOpportunityForm] = useState({
    companyId: '',
    title: '',
    stage: 'Qualification',
    estimatedValueFormatted: '₹50 Lac',
    nextAction: 'Initial proposal review',
    nextActionDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    if (!activeModal) return;

    fetch('/api/companies')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setCompaniesList(data.map((c: any) => ({ id: c.id, name: c.name })));
          if (data.length > 0) {
            setInteractionForm((prev) => {
              if (!prev.companyId) return { ...prev, companyId: data[0].id };
              return prev;
            });
            setOpportunityForm((prev) => {
              if (!prev.companyId) return { ...prev, companyId: data[0].id };
              return prev;
            });
          }
        }
      })
      .catch(() => {});
  }, [activeModal]);

  const handleModalClose = () => {
    setActiveModal(null);
    setFormSubmitted(false);
  };

  const handleCompanySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(companyForm),
      });
      if (res.ok) {
        setFormSubmitted(true);
        setTimeout(() => {
          handleModalClose();
          if (onSuccess) onSuccess();
          router.refresh();
        }, 1000);
      }
    } catch {
      alert('Failed to save company.');
    }
  };

  const handleInteractionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!interactionForm.noFurtherAction && (!interactionForm.nextAction || !interactionForm.nextActionDate)) {
      alert("Enforcement Rule: Every meaningful interaction requires either 'Next Action + Next Action Date' OR checking 'No Further Action Required'.");
      return;
    }

    try {
      const res = await fetch('/api/interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: interactionForm.companyId,
          contactName: interactionForm.contactName,
          channel: interactionForm.channel,
          summary: interactionForm.summary,
          whatTheyNeeded: interactionForm.whatTheyNeeded,
          whatWeLearned: interactionForm.whatWeLearned,
          isDecisionMakerInvolved: interactionForm.isDecisionMakerInvolved,
          servicesDiscussed: interactionForm.servicesDiscussed,
          noFurtherActionRequired: interactionForm.noFurtherAction,
          nextAction: interactionForm.nextAction,
          nextActionDate: interactionForm.nextActionDate,
        }),
      });

      if (res.ok) {
        setFormSubmitted(true);
        setTimeout(() => {
          handleModalClose();
          if (onSuccess) onSuccess();
          router.refresh();
        }, 1000);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to save interaction.');
      }
    } catch {
      alert('Failed to save interaction.');
    }
  };

  const handleOpportunitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/opportunities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(opportunityForm),
      });
      if (res.ok) {
        setFormSubmitted(true);
        setTimeout(() => {
          handleModalClose();
          if (onSuccess) onSuccess();
          router.refresh();
        }, 1000);
      }
    } catch {
      alert('Failed to save opportunity.');
    }
  };

  return (
    <>
      <div className="cockpit-panel p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
              Quick Actions
            </h3>
            <span className="text-xs text-cockpit-muted">Instant founder workflow triggers</span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <button
            onClick={() => router.push('/discover')}
            className="p-3.5 bg-cockpit-card border border-cockpit-border hover:border-meaven-blue/50 rounded-lg text-left transition-all group flex flex-col justify-between"
          >
            <div className="p-2 bg-meaven-blue/15 text-meaven-blue rounded-lg w-fit mb-3 group-hover:scale-105 transition-transform">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-200 block group-hover:text-meaven-light transition-colors">
                Find Partners
              </span>
              <span className="text-[10px] text-cockpit-muted">Discover architects & D&B</span>
            </div>
          </button>

          <button
            onClick={() => setActiveModal('company')}
            className="p-3.5 bg-cockpit-card border border-cockpit-border hover:border-meaven-blue/50 rounded-lg text-left transition-all group flex flex-col justify-between"
          >
            <div className="p-2 bg-sky-500/15 text-sky-400 rounded-lg w-fit mb-3 group-hover:scale-105 transition-transform">
              <PlusCircle className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-200 block group-hover:text-sky-300 transition-colors">
                Add Company
              </span>
              <span className="text-[10px] text-cockpit-muted">Create organization record</span>
            </div>
          </button>

          <button
            onClick={() => setActiveModal('interaction')}
            className="p-3.5 bg-cockpit-card border border-cockpit-border hover:border-meaven-blue/50 rounded-lg text-left transition-all group flex flex-col justify-between"
          >
            <div className="p-2 bg-emerald-500/15 text-emerald-400 rounded-lg w-fit mb-3 group-hover:scale-105 transition-transform">
              <MessageSquarePlus className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-200 block group-hover:text-emerald-300 transition-colors">
                Add Interaction
              </span>
              <span className="text-[10px] text-cockpit-muted">Log call, meeting or note</span>
            </div>
          </button>

          <button
            onClick={() => setActiveModal('opportunity')}
            className="p-3.5 bg-cockpit-card border border-cockpit-border hover:border-meaven-blue/50 rounded-lg text-left transition-all group flex flex-col justify-between"
          >
            <div className="p-2 bg-amber-500/15 text-amber-400 rounded-lg w-fit mb-3 group-hover:scale-105 transition-transform">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-200 block group-hover:text-amber-300 transition-colors">
                Add Opportunity
              </span>
              <span className="text-[10px] text-cockpit-muted">Record deal pipeline item</span>
            </div>
          </button>

          <button
            onClick={() => setIsCommandBarOpen(true)}
            className="p-3.5 bg-meaven-blue/15 border border-meaven-blue/40 hover:bg-meaven-blue/25 rounded-lg text-left transition-all group flex flex-col justify-between"
          >
            <div className="p-2 bg-meaven-blue text-white rounded-lg w-fit mb-3 group-hover:scale-105 transition-transform shadow-glow-meaven">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-100 block group-hover:text-meaven-light transition-colors">
                Ask Cockpit
              </span>
              <span className="text-[10px] text-meaven-light">Global AI Command</span>
            </div>
          </button>
        </div>
      </div>

      {/* Add Interaction Modal */}
      {activeModal === 'interaction' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-cockpit-surface border border-cockpit-border rounded-xl shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto">
            <button onClick={handleModalClose} className="absolute top-4 right-4 text-cockpit-muted hover:text-white">
              <X className="w-5 h-5" />
            </button>

            {formSubmitted ? (
              <div className="py-8 text-center flex flex-col items-center">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mb-3 animate-bounce" />
                <h4 className="text-lg font-bold text-slate-100">Interaction Logged</h4>
                <p className="text-xs text-cockpit-muted mt-1">Saved cleanly to SQLite database.</p>
              </div>
            ) : (
              <form onSubmit={handleInteractionSubmit} className="space-y-4">
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
                      value={interactionForm.companyId}
                      onChange={(e) => setInteractionForm({ ...interactionForm, companyId: e.target.value })}
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
                      value={interactionForm.channel}
                      onChange={(e) => setInteractionForm({ ...interactionForm, channel: e.target.value })}
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
                      value={interactionForm.contactName}
                      onChange={(e) => setInteractionForm({ ...interactionForm, contactName: e.target.value })}
                      className="w-full px-3 py-2 bg-cockpit-bg border border-cockpit-border rounded text-xs text-slate-200 focus:outline-none focus:border-meaven-blue"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">What did they need?</label>
                    <input
                      type="text"
                      placeholder="e.g. Joinery sample kit"
                      value={interactionForm.whatTheyNeeded}
                      onChange={(e) => setInteractionForm({ ...interactionForm, whatTheyNeeded: e.target.value })}
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
                    value={interactionForm.summary}
                    onChange={(e) => setInteractionForm({ ...interactionForm, summary: e.target.value, whatWeLearned: e.target.value })}
                    className="w-full px-3 py-2 bg-cockpit-bg border border-cockpit-border rounded text-xs text-slate-200 focus:outline-none focus:border-meaven-blue"
                  />
                </div>

                <label className="flex items-center gap-2 text-xs text-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={interactionForm.isDecisionMakerInvolved}
                    onChange={(e) => setInteractionForm({ ...interactionForm, isDecisionMakerInvolved: e.target.checked })}
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
                        checked={interactionForm.noFurtherAction}
                        onChange={(e) => setInteractionForm({ ...interactionForm, noFurtherAction: e.target.checked })}
                        className="rounded border-cockpit-border text-meaven-blue focus:ring-0"
                      />
                      <span>No Further Action Required</span>
                    </label>
                  </div>

                  {!interactionForm.noFurtherAction && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-300 block mb-1">Next Action *</label>
                        <input
                          type="text"
                          required={!interactionForm.noFurtherAction}
                          placeholder="Specific required action"
                          value={interactionForm.nextAction}
                          onChange={(e) => setInteractionForm({ ...interactionForm, nextAction: e.target.value })}
                          className="w-full px-2.5 py-1.5 bg-cockpit-bg border border-cockpit-border rounded text-xs text-slate-200 focus:outline-none focus:border-meaven-blue"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-slate-300 block mb-1">Next Action Date *</label>
                        <input
                          type="date"
                          required={!interactionForm.noFurtherAction}
                          value={interactionForm.nextActionDate}
                          onChange={(e) => setInteractionForm({ ...interactionForm, nextActionDate: e.target.value })}
                          className="w-full px-2.5 py-1.5 bg-cockpit-bg border border-cockpit-border rounded text-xs text-slate-200 focus:outline-none focus:border-meaven-blue"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button type="button" onClick={handleModalClose} className="px-4 py-2 bg-cockpit-bg border border-cockpit-border hover:bg-cockpit-hover text-xs font-medium text-slate-300 rounded">
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
      )}

      {/* Add Company Modal */}
      {activeModal === 'company' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-cockpit-surface border border-cockpit-border rounded-xl shadow-2xl p-6 relative">
            <button onClick={handleModalClose} className="absolute top-4 right-4 text-cockpit-muted hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <form onSubmit={handleCompanySubmit} className="space-y-4">
              <div className="flex items-center gap-2 border-b border-cockpit-border pb-3">
                <PlusCircle className="w-5 h-5 text-sky-400" />
                <div>
                  <h4 className="text-base font-bold text-slate-100">Add New Company</h4>
                  <p className="text-xs text-cockpit-muted">Creates stable organization entity in SQLite</p>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Company Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. UrbanCraft Architects"
                  value={companyForm.name}
                  onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-cockpit-bg border border-cockpit-border rounded text-xs text-slate-200"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Sector Type</label>
                  <select
                    value={companyForm.type}
                    onChange={(e) => setCompanyForm({ ...companyForm, type: e.target.value })}
                    className="w-full px-3 py-2 bg-cockpit-bg border border-cockpit-border rounded text-xs text-slate-200"
                  >
                    <option value="Interior Design">Interior Design</option>
                    <option value="Architecture">Architecture</option>
                    <option value="Turnkey D&B">Turnkey D&B</option>
                    <option value="Real Estate Developer">Real Estate Developer</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">City</label>
                  <input
                    type="text"
                    required
                    value={companyForm.city}
                    onChange={(e) => setCompanyForm({ ...companyForm, city: e.target.value })}
                    className="w-full px-3 py-2 bg-cockpit-bg border border-cockpit-border rounded text-xs text-slate-200"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={handleModalClose} className="px-4 py-1.5 bg-cockpit-bg text-xs font-medium text-slate-300 rounded border border-cockpit-border">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-meaven-blue text-white text-xs font-semibold rounded">Save Company</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Opportunity Modal */}
      {activeModal === 'opportunity' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-cockpit-surface border border-cockpit-border rounded-xl shadow-2xl p-6 relative">
            <button onClick={handleModalClose} className="absolute top-4 right-4 text-cockpit-muted hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <form onSubmit={handleOpportunitySubmit} className="space-y-4">
              <div className="flex items-center gap-2 border-b border-cockpit-border pb-3">
                <Target className="w-5 h-5 text-amber-400" />
                <div>
                  <h4 className="text-base font-bold text-slate-100">Add Opportunity</h4>
                  <p className="text-xs text-cockpit-muted">Track pre-project commercial deal pipeline</p>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Company</label>
                <select
                  value={opportunityForm.companyId}
                  onChange={(e) => setOpportunityForm({ ...opportunityForm, companyId: e.target.value })}
                  className="w-full px-3 py-2 bg-cockpit-bg border border-cockpit-border rounded text-xs text-slate-200"
                >
                  {companiesList.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Opportunity Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Commercial HQ Fitout Joinery Package"
                  value={opportunityForm.title}
                  onChange={(e) => setOpportunityForm({ ...opportunityForm, title: e.target.value })}
                  className="w-full px-3 py-2 bg-cockpit-bg border border-cockpit-border rounded text-xs text-slate-200"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Stage</label>
                  <select
                    value={opportunityForm.stage}
                    onChange={(e) => setOpportunityForm({ ...opportunityForm, stage: e.target.value })}
                    className="w-full px-3 py-2 bg-cockpit-bg border border-cockpit-border rounded text-xs text-slate-200"
                  >
                    <option value="Qualification">Qualification</option>
                    <option value="Discovery">Discovery</option>
                    <option value="Proposal">Proposal</option>
                    <option value="Negotiation">Negotiation</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Estimated Value</label>
                  <input
                    type="text"
                    value={opportunityForm.estimatedValueFormatted}
                    onChange={(e) => setOpportunityForm({ ...opportunityForm, estimatedValueFormatted: e.target.value })}
                    className="w-full px-3 py-2 bg-cockpit-bg border border-cockpit-border rounded text-xs text-slate-200"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={handleModalClose} className="px-4 py-1.5 bg-cockpit-bg text-xs font-medium text-slate-300 rounded border border-cockpit-border">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-meaven-blue text-white text-xs font-semibold rounded">Save Opportunity</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <AICommandBar isOpen={isCommandBarOpen} onClose={() => setIsCommandBarOpen(false)} />
    </>
  );
};
