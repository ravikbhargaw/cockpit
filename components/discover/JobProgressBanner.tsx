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
  const candidateCount = job.candidateCount || 0;
  const qualifiedCount = job.qualifiedCount || 0;
  const shortlistCount = job.finalShortlistCount || 0;

  // Compute individual truthful state for each stage
  const getStageDisplay = (idx: number, key: ResearchJobStatus, label: string) => {
    let state: 'SUCCESS' | 'ACTIVE' | 'EMPTY' | 'FAILED' | 'PENDING' = 'PENDING';
    let subtext = '';

    if (idx === 0) {
      // 1. Planning
      if (job.status === 'PLANNING') {
        state = 'ACTIVE';
        subtext = 'Planning criteria';
      } else if (isFailed && currentIndex === 0) {
        state = 'FAILED';
        subtext = 'Planning failed';
      } else if (job.parsedCriteria && Object.keys(job.parsedCriteria).length > 0) {
        state = 'SUCCESS';
        subtext = 'Criteria planned';
      }
    } else if (idx === 1) {
      // 2. Web Discovery
      if (job.status === 'DISCOVERING') {
        state = 'ACTIVE';
        subtext = 'Live web search';
      } else if (isFailed && currentIndex === 1) {
        state = 'FAILED';
        subtext = 'Discovery failed';
      } else if (currentIndex > 1 || isFinished) {
        if (candidateCount > 0) {
          state = 'SUCCESS';
          subtext = `${candidateCount} discovered`;
        } else {
          state = 'EMPTY';
          subtext = '0 discovered';
        }
      }
    } else if (idx === 2) {
      // 3. Deduplicating
      if (job.status === 'FILTERING') {
        state = 'ACTIVE';
        subtext = 'Deduplicating';
      } else if (isFailed && currentIndex === 2) {
        state = 'FAILED';
        subtext = 'Filter failed';
      } else if (currentIndex > 2 || isFinished) {
        if (candidateCount > 0) {
          state = 'SUCCESS';
          subtext = 'Deduplicated';
        } else {
          state = 'EMPTY';
          subtext = 'Skipped (0)';
        }
      }
    } else if (idx === 3) {
      // 4. AI Qualifying
      if (job.status === 'QUALIFYING') {
        state = 'ACTIVE';
        subtext = 'Qualifying';
      } else if (isFailed && currentIndex === 3) {
        state = 'FAILED';
        subtext = 'Qualify failed';
      } else if (currentIndex > 3 || isFinished) {
        if (qualifiedCount > 0) {
          state = 'SUCCESS';
          subtext = `${qualifiedCount} qualified`;
        } else {
          state = 'EMPTY';
          subtext = '0 qualified';
        }
      }
    } else if (idx === 4) {
      // 5. Ready for Review
      if (isFailed) {
        state = 'FAILED';
        subtext = 'Job failed';
      } else if (isFinished) {
        if (shortlistCount > 0) {
          state = 'SUCCESS';
          subtext = `${shortlistCount} ready`;
        } else {
          state = 'EMPTY';
          subtext = '0 ready';
        }
      }
    }

    return { label, state, subtext };
  };

  const hasSuccessfulResults = isFinished && shortlistCount > 0;
  const isFinishedEmpty = isFinished && shortlistCount === 0;

  return (
    <div className={`rounded-xl border p-5 shadow-xl backdrop-blur-md space-y-4 ${
      isFailed
        ? 'border-red-500/40 bg-red-950/20'
        : isFinishedEmpty
        ? 'border-amber-500/40 bg-slate-900/90'
        : 'border-[#36668d]/40 bg-slate-900/90'
    }`}>
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-3">
          <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${
            hasSuccessfulResults
              ? 'bg-emerald-500/20 text-emerald-400'
              : isFailed
              ? 'bg-red-500/20 text-red-400'
              : isFinishedEmpty
              ? 'bg-amber-500/20 text-amber-400'
              : 'bg-[#36668d]/20 text-[#36668d]'
          }`}>
            {hasSuccessfulResults ? (
              <CheckCircle2 className="h-5 w-5" />
            ) : isFailed ? (
              <AlertTriangle className="h-5 w-5 text-red-400" />
            ) : isFinishedEmpty ? (
              <Clock className="h-5 w-5 text-amber-400" />
            ) : (
              <Sparkles className="h-5 w-5 animate-pulse" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-100 uppercase tracking-wider">
                {hasSuccessfulResults
                  ? 'AI Research Completed'
                  : isFailed
                  ? 'AI Research Failed'
                  : isFinishedEmpty
                  ? 'Research Complete (0 Candidates Found)'
                  : 'AI Research Engine Active'}
              </span>
              <span className="rounded bg-slate-800 px-2 py-0.5 font-mono text-[10px] text-slate-300">
                {job.modelName || 'gpt-4o-mini'}
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
            <span>Shortlist: <strong>{shortlistCount}</strong></span>
          </div>
          <div className="flex items-center gap-1 font-mono font-semibold text-[#36668d] bg-[#36668d]/10 px-2.5 py-1 rounded border border-[#36668d]/30">
            Actual Cost: {formatINR(job.estimatedCost || 0)}
          </div>
          {onDismiss && (isFinished || isFailed) && (
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
          const { label, state, subtext } = getStageDisplay(idx, stg.key, stg.label);

          let stateClasses = 'border-slate-800 bg-slate-950/40 text-slate-500';
          if (state === 'SUCCESS') {
            stateClasses = 'border-emerald-500/40 bg-emerald-950/20 text-emerald-300';
          } else if (state === 'ACTIVE') {
            stateClasses = 'border-[#36668d] bg-[#36668d]/20 text-slate-100 font-medium animate-pulse';
          } else if (state === 'EMPTY') {
            stateClasses = 'border-amber-500/30 bg-amber-950/20 text-amber-300';
          } else if (state === 'FAILED') {
            stateClasses = 'border-red-500/40 bg-red-950/30 text-red-300';
          }

          return (
            <div
              key={stg.key}
              className={`rounded-lg p-2.5 border transition-all text-center flex flex-col justify-center min-h-[54px] ${stateClasses}`}
            >
              <span className="text-[11px] font-medium block truncate">{label}</span>
              {subtext && (
                <span className="text-[9px] opacity-80 block truncate mt-0.5 font-mono">
                  {subtext}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Status Message */}
      <div className={`flex items-center justify-between text-xs px-3 py-2 rounded-lg border ${
        isFailed
          ? 'bg-red-950/30 border-red-900/50 text-red-200'
          : 'bg-slate-950/50 border-slate-800 text-slate-300'
      }`}>
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
