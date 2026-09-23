'use client';

import React, { useEffect, useState } from 'react';
import { Sparkles, CheckCircle2, Clock, AlertTriangle, RefreshCw, Layers } from 'lucide-react';
import { ResearchJob, ResearchJobStatus } from '@/types';
import { formatINR } from '@/lib/utils';

interface JobProgressBannerProps {
  jobId: string;
  onJobComplete: () => void;
  onDismiss?: () => void;
}

const STAGES: { key: ResearchJobStatus; label: string }[] = [
  { key: 'PLANNING', label: '1. Planning' },
  { key: 'DISCOVERING', label: '2. Web Discovery' },
  { key: 'FILTERING', label: '3. Deduplicating' },
  { key: 'QUALIFYING', label: '4. AI Qualifying' },
  { key: 'READY_FOR_REVIEW', label: '5. Ready for Review' },
];

export default function JobProgressBanner({
  jobId,
  onJobComplete,
  onDismiss,
}: JobProgressBannerProps) {
  const [job, setJob] = useState<ResearchJob | null>(null);

  const hasNotifiedRef = React.useRef(false);

  useEffect(() => {
    hasNotifiedRef.current = false;
  }, [jobId]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    let isCancelled = false;

    const fetchStatus = async () => {
      try {
        const res = await fetch(`/api/discover/jobs/${jobId}`);
        const data = await res.json();
        if (!isCancelled && data.success && data.job) {
          setJob(data.job);
          const isFinished = data.job.status === 'READY_FOR_REVIEW' || data.job.status === 'COMPLETED' || data.job.status === 'FAILED';
          if (isFinished) {
            if (!hasNotifiedRef.current) {
              hasNotifiedRef.current = true;
              onJobComplete();
            }
          } else {
            timer = setTimeout(fetchStatus, 2000);
          }
        }
      } catch (err) {
        console.error('Error polling job status:', err);
      }
    };

    fetchStatus();

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [jobId, onJobComplete]);

  if (!job) return null;

  const getStageIndex = (status: ResearchJobStatus) => {
    switch (status) {
      case 'PLANNING': return 0;
      case 'DISCOVERING': return 1;
      case 'FILTERING': return 2;
      case 'QUALIFYING':
      case 'DEEP_RESEARCH': return 3;
      case 'READY_FOR_REVIEW':
      case 'COMPLETED': return 4;
      default: return 0;
    }
  };

  const currentIndex = getStageIndex(job.status);
  const isFinished = job.status === 'READY_FOR_REVIEW' || job.status === 'COMPLETED';
  const isFailed = job.status === 'FAILED';

  return (
    <div className="rounded-xl border border-[#36668d]/40 bg-slate-900/90 p-5 shadow-xl backdrop-blur-md space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-3">
          <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${isFinished ? 'bg-emerald-500/20 text-emerald-400' : 'bg-[#36668d]/20 text-[#36668d]'}`}>
            {isFinished ? (
              <CheckCircle2 className="h-5 w-5" />
            ) : isFailed ? (
              <AlertTriangle className="h-5 w-5 text-red-400" />
            ) : (
              <Sparkles className="h-5 w-5 animate-pulse" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-100 uppercase tracking-wider">
                {isFinished ? 'AI Research Completed' : 'AI Research Engine Active'}
              </span>
              <span className="rounded bg-slate-800 px-2 py-0.5 font-mono text-[10px] text-slate-300">
                {job.modelName || 'gpt-5.6-luna'}
              </span>
            </div>
            <p className="text-xs text-slate-300 italic line-clamp-1 mt-0.5">
              &quot;{job.originalInstruction}&quot;
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5 text-slate-300">
            <Layers className="h-3.5 w-3.5 text-slate-400" />
            <span>Candidates: <strong>{job.finalShortlistCount || job.qualifiedCount || job.candidateCount}</strong></span>
          </div>
          <div className="flex items-center gap-1 font-mono font-semibold text-[#36668d] bg-[#36668d]/10 px-2.5 py-1 rounded border border-[#36668d]/30">
            Actual Cost: {formatINR(job.estimatedCost || 0)}
          </div>
          {onDismiss && isFinished && (
            <button
              onClick={onDismiss}
              className="rounded bg-slate-800 px-3 py-1 text-xs text-slate-300 hover:bg-slate-700 transition-colors"
            >
              Dismiss
            </button>
          )}
        </div>
      </div>

      {/* Stage Tracker */}
      <div className="grid grid-cols-5 gap-2">
        {STAGES.map((stg, idx) => {
          const isActive = idx === currentIndex && !isFinished && !isFailed;
          const isDone = idx < currentIndex || isFinished;

          return (
            <div
              key={stg.key}
              className={`rounded-lg p-2.5 border transition-all text-center ${
                isDone
                  ? 'border-emerald-500/40 bg-emerald-950/20 text-emerald-300'
                  : isActive
                  ? 'border-[#36668d] bg-[#36668d]/20 text-slate-100 font-medium animate-pulse'
                  : 'border-slate-800 bg-slate-950/40 text-slate-500'
              }`}
            >
              <span className="text-[11px] block truncate">{stg.label}</span>
            </div>
          );
        })}
      </div>

      {/* Status Message */}
      <div className="flex items-center justify-between text-xs text-slate-300 bg-slate-950/50 px-3 py-2 rounded-lg border border-slate-800">
        <span className="flex items-center gap-2">
          {!isFinished && !isFailed && <RefreshCw className="h-3.5 w-3.5 animate-spin text-[#36668d]" />}
          {job.statusMessage || 'Processing research task...'}
        </span>
        <span className="text-[10px] text-slate-400 font-mono">
          Safety limit: ₹{job.budgetLimit || 150}
        </span>
      </div>
    </div>
  );
}
