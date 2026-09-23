'use client';

import React, { useState } from 'react';
import { Sparkles, X, AlertCircle, Loader2 } from 'lucide-react';

interface NewResearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJobStarted: (jobId: string) => void;
}

export default function NewResearchModal({
  isOpen,
  onClose,
  onJobStarted,
}: NewResearchModalProps) {
  const [instruction, setInstruction] = useState('');
  const [budgetLimit, setBudgetLimit] = useState<number>(150);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!instruction.trim()) {
      setError('Please describe what type of companies you want to find.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Create Job
      const res = await fetch('/api/discover/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instruction: instruction.trim(),
          budgetLimit,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to create research job');
      }

      const jobId = data.job.id;
      onJobStarted(jobId);
      onClose();
      setInstruction('');

      // 2. Trigger pipeline run in background asynchronously
      fetch(`/api/discover/jobs/${jobId}/run`, {
        method: 'POST',
      }).catch(err => console.error('Background pipeline error:', err));

    } catch (err: any) {
      setError(err.message || 'An error occurred while launching research');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-xl border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#36668d]/20 text-[#36668d] border border-[#36668d]/30">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-100">AI Research Engine</h2>
              <p className="text-xs text-slate-400">Describe what you are looking for in natural language</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="flex items-start gap-3 rounded-lg border border-red-500/30 bg-red-950/40 p-4 text-xs text-red-300">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Research Instruction <span className="text-red-400">*</span>
            </label>
            <textarea
              rows={4}
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder="e.g. Find high-end luxury residential interior design studios in Mumbai with 15+ employees that handle turnkey execution."
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:border-[#36668d] focus:outline-none focus:ring-1 focus:ring-[#36668d]"
            />
            <p className="mt-1.5 text-[11px] text-slate-400">
              Tip: Include geographies, specialization, scale, or service requirements. The AI Planner will structure criteria automatically.
            </p>
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-slate-200">Maximum Safety Budget Ceiling</span>
                <p className="text-[11px] text-slate-400">Execution stops automatically if ceiling is reached. Actual cost is usually ₹20–₹50.</p>
              </div>
              <div className="flex items-center gap-1 font-mono text-sm font-semibold text-[#36668d]">
                ₹{budgetLimit}
              </div>
            </div>
            <input
              type="range"
              min={50}
              max={300}
              step={10}
              value={budgetLimit}
              onChange={(e) => setBudgetLimit(Number(e.target.value))}
              className="w-full accent-[#36668d]"
            />
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-700 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 rounded-lg bg-[#36668d] px-5 py-2 text-xs font-semibold text-white shadow-lg shadow-[#36668d]/20 hover:bg-[#36668d]/90 disabled:opacity-50 transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Planning Research...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Run AI Research Engine</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
