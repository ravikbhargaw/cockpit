'use client';

import React, { useState, useEffect } from 'react';
import { X, UserPlus, Mail, Phone, Linkedin, CheckSquare, ShieldCheck } from 'lucide-react';

interface AddContactModalProps {
  isOpen: boolean;
  companyId: string;
  companyName: string;
  initialContact?: any;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddContactModal({ isOpen, companyId, companyName, initialContact, onClose, onSuccess }: AddContactModalProps) {
  const [form, setForm] = useState({
    name: '',
    role: '',
    email: '',
    phone: '',
    linkedin: '',
    notes: '',
    isDecisionMaker: false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialContact) {
      setForm({
        name: initialContact.name || '',
        role: initialContact.role || '',
        email: initialContact.email || '',
        phone: initialContact.phone || '',
        linkedin: initialContact.linkedin || '',
        notes: initialContact.notes || '',
        isDecisionMaker: Boolean(initialContact.isDecisionMaker),
      });
    } else {
      setForm({
        name: '',
        role: '',
        email: '',
        phone: '',
        linkedin: '',
        notes: '',
        isDecisionMaker: false,
      });
    }
  }, [initialContact, isOpen]);

  if (!isOpen) return null;

  const validateEmail = (emailStr: string) => {
    if (!emailStr.trim()) return true;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailStr.trim());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('Contact Name is required');
      return;
    }

    if (form.email && !validateEmail(form.email)) {
      setError('Please enter a valid email address (e.g. name@company.com)');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const isEdit = Boolean(initialContact && initialContact.id);
      const url = isEdit ? `/api/contacts/${initialContact.id}` : '/api/contacts';
      const method = isEdit ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          companyId,
          id: initialContact?.id,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save contact');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'An error occurred while saving the contact');
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
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-100">
                {initialContact ? 'Edit Contact' : 'Add New Contact'}
              </h2>
              <p className="text-xs text-slate-400">{companyName}</p>
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

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Contact Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Ar. Priya Sharma"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Role / Designation</label>
            <input
              type="text"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              placeholder="e.g. Design Director & Managing Partner"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="priya@company.co"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Phone</label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+91 98200 11223"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">LinkedIn URL</label>
            <input
              type="text"
              value={form.linkedin}
              onChange={(e) => setForm({ ...form, linkedin: e.target.value })}
              placeholder="https://linkedin.com/in/priya-sharma"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isDecisionMaker"
              checked={form.isDecisionMaker}
              onChange={(e) => setForm({ ...form, isDecisionMaker: e.target.checked })}
              className="w-4 h-4 text-emerald-500 bg-slate-950 border-slate-800 rounded focus:ring-emerald-500"
            />
            <label htmlFor="isDecisionMaker" className="text-xs font-medium text-slate-200 cursor-pointer flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>Key Decision Maker (Principal / Founder / Director)</span>
            </label>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Notes / Context</label>
            <textarea
              rows={2}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Primary decision maker for interior execution vendor selection..."
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
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs rounded-lg transition disabled:opacity-50"
            >
              {loading ? 'Saving...' : initialContact ? 'Update Contact' : 'Save Contact'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
