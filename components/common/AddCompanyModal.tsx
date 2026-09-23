'use client';

import React, { useState } from 'react';
import { X, Building2, Globe, MapPin, Tag, User, ShieldAlert, Sparkles } from 'lucide-react';

interface AddCompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (companyId: string) => void;
}

export function AddCompanyModal({ isOpen, onClose, onSuccess }: AddCompanyModalProps) {
  const [form, setForm] = useState({
    name: '',
    website: '',
    domain: '',
    city: '',
    companyType: 'Architecture',
    industry: 'Commercial Interiors',
    description: '',
    status: 'Prospect',
    temperature: 'Warm',
    owner: 'Ravi',
    notes: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<any>(null);

  if (!isOpen) return null;

  const handleDomainBlur = async () => {
    if (!form.website && !form.domain && !form.name) return;
    try {
      const res = await fetch('/api/companies');
      if (res.ok) {
        const companies = await res.json();
        const inputDom = (form.domain || form.website).toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '').trim();
        const inputName = form.name.toLowerCase().trim();

        if (!inputDom && !inputName) return;

        const match = companies.find((c: any) => {
          const cDom = (c.domain || c.website || '').toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '').trim();
          if (inputDom && cDom && inputDom === cDom) return true;
          if (inputName && c.name.toLowerCase().trim() === inputName) return true;
          return false;
        });

        if (match) {
          setDuplicateWarning(match);
        } else {
          setDuplicateWarning(null);
        }
      }
    } catch (e) {}
  };

  const handleSubmit = async (e: React.FormEvent, force: boolean = false) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('Company Name is required');
      return;
    }

    if (duplicateWarning && !force) {
      return; // Waiting for user confirmation on warning card
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create company');
      }

      if (data.isDuplicate && !force) {
        setDuplicateWarning(data.existingCompany);
        setLoading(false);
        return;
      }

      onSuccess(data.companyId);
      onClose();
    } catch (err: any) {
      setError(err.message || 'An error occurred while creating the company');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-100">Add New Company</h2>
              <p className="text-xs text-slate-400">Create a company record and relationship entry</p>
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
        <form onSubmit={(e) => handleSubmit(e, false)} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs">
              {error}
            </div>
          )}

          {duplicateWarning && (
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-200 text-xs space-y-2">
              <div className="flex items-center gap-2 font-medium text-amber-400">
                <ShieldAlert className="w-4 h-4" />
                <span>Existing Matching Company Found</span>
              </div>
              <p>
                A company named <strong>{duplicateWarning.name}</strong> ({duplicateWarning.city || 'India'}) with website <strong>{duplicateWarning.website || duplicateWarning.domain}</strong> already exists in your Founder Cockpit.
              </p>
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    onSuccess(duplicateWarning.id);
                    onClose();
                  }}
                  className="px-3 py-1.5 bg-amber-500 text-slate-950 font-medium rounded-lg hover:bg-amber-400 text-xs transition"
                >
                  Open Existing Company Account
                </button>
                <button
                  type="button"
                  onClick={(e) => handleSubmit(e, true)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 font-medium rounded-lg hover:bg-slate-700 text-xs transition border border-slate-700"
                >
                  Proceed & Create Duplicate
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Company Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                onBlur={handleDomainBlur}
                placeholder="e.g. Studio Arc Design"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Website URL</label>
              <input
                type="text"
                value={form.website}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
                onBlur={handleDomainBlur}
                placeholder="https://studioarc.in"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Location / City</label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                placeholder="e.g. Bengaluru"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Company Type</label>
              <select
                value={form.companyType}
                onChange={(e) => setForm({ ...form, companyType: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="Architecture">Architecture</option>
                <option value="Interior Design">Interior Design</option>
                <option value="Turnkey D&B">Turnkey D&B</option>
                <option value="Commercial Workspace">Commercial Workspace</option>
                <option value="Boutique Studio">Boutique Studio</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Relationship Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="Prospect">Prospect</option>
                <option value="Opportunity">Opportunity</option>
                <option value="Meeting">Meeting</option>
                <option value="Active Partner">Active Partner</option>
                <option value="Strategic Partner">Strategic Partner</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Relationship Temperature</label>
              <select
                value={form.temperature}
                onChange={(e) => setForm({ ...form, temperature: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="Warm">Warm 🔥</option>
                <option value="Hot">Hot ⚡</option>
                <option value="Cold">Cold ❄️</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Company Description / Overview</label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Boutique architectural practice specializing in commercial & high-end residential fitouts..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Company Notes (Permanent Founder Context)</label>
            <textarea
              rows={3}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Key strategic observations, founder intro background, alignment notes..."
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
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs rounded-lg transition disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? 'Creating...' : 'Create Company'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
