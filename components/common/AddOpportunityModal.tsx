'use client';

import React, { useState, useEffect } from 'react';
import { X, TrendingUp, IndianRupee, Calendar, CheckSquare } from 'lucide-react';

interface AddOpportunityModalProps {
  isOpen: boolean;
  companyId?: string;
  companyName?: string;
  companies?: any[];
  initialOpportunity?: any;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddOpportunityModal({
  isOpen,
  companyId,
  companyName,
  companies = [],
  initialOpportunity,
  onClose,
  onSuccess,
}: AddOpportunityModalProps) {
  const [form, setForm] = useState({
    companyId: companyId || '',
    title: '',
    stage: 'Qualification',
    estimatedValueAmount: '',
    nextAction: '',
    nextActionDate: new Date().toISOString().split('T')[0],
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialOpportunity) {
      setForm({
        companyId: initialOpportunity.companyId || companyId || '',
        title: initialOpportunity.title || '',
        stage: initialOpportunity.stage || 'Qualification',
        estimatedValueAmount: initialOpportunity.estimatedValueAmount !== undefined ? String(initialOpportunity.estimatedValueAmount) : '',
        nextAction: initialOpportunity.nextAction || '',
        nextActionDate: initialOpportunity.nextActionDate || new Date().toISOString().split('T')[0],
      });
    } else {
      setForm({
        companyId: companyId || '',
        title: '',
        stage: 'Qualification',
        estimatedValueAmount: '',
        nextAction: '',
        nextActionDate: new Date().toISOString().split('T')[0],
      });
    }
  }, [initialOpportunity, companyId, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.companyId) {
      setError('Please select a company');
      return;
    }
    if (!form.title.trim()) {
      setError('Opportunity Title is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const isEdit = Boolean(initialOpportunity && initialOpportunity.id);
      const url = isEdit ? `/api/opportunities/${initialOpportunity.id}` : '/api/opportunities';
      const method = isEdit ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          estimatedValueAmount: Number(form.estimatedValueAmount) || 0,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save opportunity');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'An error occurred while saving the opportunity');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-md shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-100">
                {initialOpportunity ? 'Edit Opportunity' : 'Create Opportunity'}
              </h2>
              <p className="text-xs text-slate-400">{companyName || 'Commercial Pipeline'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs">
              {error}
            </div>
          )}

          {!companyId && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Company *</label>
              <select
                required
                value={form.companyId}
                onChange={(e) => setForm({ ...form, companyId: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="">Select Company...</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.city || 'India'})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Opportunity Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Bengaluru Tech Park - Phase 2 Joinery"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Pipeline Stage</label>
              <select
                value={form.stage}
                onChange={(e) => setForm({ ...form, stage: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="Qualification">Qualification</option>
                <option value="Discovery">Discovery</option>
                <option value="Proposal">Proposal</option>
                <option value="Negotiation">Negotiation</option>
                <option value="Closed Won">Closed Won</option>
                <option value="Closed Lost">Closed Lost</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Estimated Value (₹ INR)</label>
              <input
                type="number"
                value={form.estimatedValueAmount}
                onChange={(e) => setForm({ ...form, estimatedValueAmount: e.target.value })}
                placeholder="e.g. 7500000"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Next Commercial Action</label>
            <input
              type="text"
              value={form.nextAction}
              onChange={(e) => setForm({ ...form, nextAction: e.target.value })}
              placeholder="e.g. Submit refined BOQ schedule & pricing tier"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Next Action Target Date</label>
            <input
              type="date"
              value={form.nextActionDate}
              onChange={(e) => setForm({ ...form, nextActionDate: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs rounded-lg transition disabled:opacity-50"
            >
              {loading ? 'Saving...' : initialOpportunity ? 'Update Opportunity' : 'Create Opportunity'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
