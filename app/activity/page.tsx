'use client';

import React, { useState, useEffect } from 'react';
import { Activity as ActivityIcon, CheckCircle2, ShieldCheck, Plus } from 'lucide-react';
import { InteractionModal } from '@/components/common/InteractionModal';

export default function ActivityPage() {
  const [interactions, setInteractions] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchInteractions = async () => {
    try {
      const res = await fetch('/api/interactions');
      if (res.ok) {
        const json = await res.json();
        setInteractions(json);
      }
    } catch {
      console.error('Failed to fetch interactions');
    }
  };

  useEffect(() => {
    fetchInteractions();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="cockpit-panel p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ActivityIcon className="w-4 h-4 text-meaven-blue" />
              <span className="text-xs font-bold uppercase tracking-wider text-meaven-blue">
                Relationship History & Timeline
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-100">Interaction Stream</h1>
            <p className="text-xs text-cockpit-muted mt-1 max-w-2xl">
              Complete audit trail of calls, meetings, messages, and notes. Enforces structured capture of needs, learnings, and next actions.
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-meaven-blue hover:bg-meaven-hover text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 self-start sm:self-center shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Interaction</span>
          </button>
        </div>
      </div>

      {/* Activity Timeline List */}
      <div className="space-y-4">
        {interactions.length === 0 ? (
          <div className="py-12 text-center text-xs text-cockpit-muted cockpit-panel border border-dashed border-cockpit-border">
            No interactions recorded in SQLite database yet. Click &quot;Add Interaction&quot; to log your first call or meeting.
          </div>
        ) : (
          interactions.map((int) => (
            <div key={int.id} className="cockpit-card p-5 relative border-l-4 border-l-meaven-blue">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2.5">
                  <span className="px-2.5 py-0.5 bg-meaven-blue/20 text-meaven-light border border-meaven-blue/40 text-xs font-bold uppercase rounded">
                    {int.channel}
                  </span>
                  <h3 className="text-base font-bold text-slate-100">{int.companyName || 'Partner'}</h3>
                  <span className="text-xs text-cockpit-muted">({int.contactName})</span>
                </div>
                <span className="text-xs font-mono text-cockpit-subtle">{int.date}</span>
              </div>

              <p className="text-xs text-slate-200 leading-relaxed mb-4">
                {int.summary}
              </p>

              {/* Structured Information Cards */}
              {(int.whatTheyNeeded || int.whatWeLearned) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-cockpit-bg p-3.5 rounded-lg border border-cockpit-border mb-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-cockpit-subtle block mb-0.5">What did they need?</span>
                    <span className="text-slate-200">{int.whatTheyNeeded || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-cockpit-subtle block mb-0.5">What did we learn?</span>
                    <span className="text-slate-200">{int.whatWeLearned || 'N/A'}</span>
                  </div>
                </div>
              )}

              {/* Mandatory Next Action */}
              <div className="p-3 bg-meaven-blue/10 border border-meaven-blue/30 rounded-lg flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-2 text-meaven-light">
                  <CheckCircle2 className="w-4 h-4 text-meaven-blue" />
                  <span>
                    <strong>Next Action:</strong> {int.noFurtherActionRequired ? 'No further action required' : int.nextAction}
                  </span>
                </div>
                {!int.noFurtherActionRequired && (
                  <span className="text-slate-300">Target Date: {int.nextActionDate}</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <InteractionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchInteractions}
      />
    </div>
  );
}
