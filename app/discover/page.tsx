'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Compass,
  Sparkles,
  Filter,
  CheckCircle2,
  UserCheck,
  Search,
  Plus,
  AlertCircle,
  ExternalLink,
  Clock,
  Ban,
  Archive,
  Eye,
  History,
  FileText,
} from 'lucide-react';
import { ResearchCandidate, ResearchStatus, ResearchJob } from '@/types';
import { ResearchSetupArea } from '@/components/discover/ResearchSetupArea';
import { AddCandidateModal } from '@/components/discover/AddCandidateModal';
import { ResearchDetailModal } from '@/components/discover/ResearchDetailModal';
import NewResearchModal from '@/components/discover/NewResearchModal';
import JobProgressBanner from '@/components/discover/JobProgressBanner';
import { printResearchDossier } from '@/lib/exportPdf';
import { formatINR, formatDateTime } from '@/lib/utils';

export default function DiscoverPage() {
  const [candidates, setCandidates] = useState<ResearchCandidate[]>([]);
  const [jobs, setJobs] = useState<ResearchJob[]>([]);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);

  const jobMap = React.useMemo(() => {
    const map: Record<string, ResearchJob> = {};
    jobs.forEach((j) => {
      map[j.id] = j;
    });
    return map;
  }, [jobs]);

  const [metrics, setMetrics] = useState({
    totalCandidates: 0,
    readyForReview: 0,
    highPriority: 0,
    approved: 0,
  });

  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState<boolean>(false);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  const fetchCandidates = useCallback(async () => {
    try {
      const res = await fetch(`/api/discover/candidates?status=${selectedStatus}&search=${encodeURIComponent(searchQuery)}`);
      if (res.status === 401) {
        window.location.href = '/login';
        return;
      }
      if (res.ok) {
        const json = await res.json();
        setCandidates(json.candidates || []);
        if (json.metrics) {
          setMetrics(json.metrics);
        }
      }
    } catch {
      console.error('Failed to fetch research candidates');
    }
  }, [selectedStatus, searchQuery]);

  const fetchJobs = useCallback(async () => {
    try {
      const res = await fetch('/api/discover/jobs');
      if (res.status === 401) {
        window.location.href = '/login';
        return;
      }
      if (res.ok) {
        const json = await res.json();
        if (json.jobs) {
          setJobs(json.jobs);
          // Check if there is a running/active job
          const running = json.jobs.find((j: ResearchJob) =>
            j.status === 'PLANNING' || j.status === 'DISCOVERING' || j.status === 'FILTERING' || j.status === 'QUALIFYING'
          );
          if (running) {
            setActiveJobId(running.id);
          }
        }
      }
    } catch {
      console.error('Failed to fetch research jobs');
    }
  }, []);

  // Fetch candidates whenever status or search query changes
  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

  // Fetch jobs once on mount
  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handleJobStarted = useCallback((jobId: string) => {
    setActiveJobId(jobId);
    fetchJobs();
    fetchCandidates();
  }, [fetchJobs, fetchCandidates]);

  const handleJobComplete = useCallback(() => {
    fetchCandidates();
    fetchJobs();
  }, [fetchCandidates, fetchJobs]);

  const handleOpenResearch = (id: string) => {
    setSelectedCandidateId(id);
    setIsDetailModalOpen(true);
  };

  const handleQuickStatusChange = async (id: string, newStatus: ResearchStatus) => {
    try {
      const res = await fetch(`/api/discover/candidates/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ researchStatus: newStatus }),
      });
      if (res.ok) {
        fetchCandidates();
      }
    } catch {
      alert('Failed to update status');
    }
  };

  const handleQuickApprove = async (id: string) => {
    try {
      const res = await fetch(`/api/discover/candidates/${id}/approve`, {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAlertMessage(data.message || 'Candidate approved into company relationship system.');
        fetchCandidates();
        setTimeout(() => setAlertMessage(null), 5000);
      } else {
        alert(data.error || 'Failed to approve candidate');
      }
    } catch {
      alert('Failed to approve candidate');
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="cockpit-panel p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Compass className="w-4 h-4 text-meaven-blue" />
              <span className="text-xs font-bold uppercase tracking-wider text-meaven-blue font-mono">
                AI RESEARCH ENGINE
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-100">Find companies worth building relationships with</h1>
            <p className="text-xs text-cockpit-muted mt-1 max-w-2xl">
              Server-side AI research engine with evidence verification, domain deduplication, and founder review.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-center shrink-0">
            <button
              onClick={() => setIsAIModalOpen(true)}
              className="px-4 py-2 bg-[#36668d] hover:bg-[#36668d]/90 text-white text-xs font-semibold rounded-lg shadow-md shadow-[#36668d]/20 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Run AI Research Engine</span>
            </button>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Candidate</span>
            </button>
          </div>
        </div>
      </div>

      {/* Live Job Progress Banner */}
      {activeJobId && (
        <JobProgressBanner
          jobId={activeJobId}
          onJobComplete={handleJobComplete}
          onDismiss={() => setActiveJobId(null)}
        />
      )}

      {/* 2. Research Queue Metrics Header */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="cockpit-card p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono text-cockpit-muted uppercase block">Total Candidates</span>
            <span className="text-2xl font-bold font-mono text-slate-100">{metrics.totalCandidates}</span>
          </div>
          <div className="p-2 bg-meaven-blue/15 text-meaven-blue rounded-lg">
            <Compass className="w-5 h-5" />
          </div>
        </div>

        <div className="cockpit-card p-4 flex items-center justify-between border-l-2 border-l-amber-400">
          <div>
            <span className="text-[11px] font-mono text-cockpit-muted uppercase block">Ready for Review</span>
            <span className="text-2xl font-bold font-mono text-amber-400">{metrics.readyForReview}</span>
          </div>
          <div className="p-2 bg-amber-400/15 text-amber-400 rounded-lg">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="cockpit-card p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono text-cockpit-muted uppercase block">High Priority</span>
            <span className="text-2xl font-bold font-mono text-rose-400">{metrics.highPriority}</span>
          </div>
          <div className="p-2 bg-rose-400/15 text-rose-400 rounded-lg">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>

        <div className="cockpit-card p-4 flex items-center justify-between border-l-2 border-l-emerald-400">
          <div>
            <span className="text-[11px] font-mono text-cockpit-muted uppercase block">Approved Prospects</span>
            <span className="text-2xl font-bold font-mono text-emerald-400">{metrics.approved}</span>
          </div>
          <div className="p-2 bg-emerald-400/15 text-emerald-400 rounded-lg">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Research Job History Bar */}
      {jobs.length > 0 && (
        <div className="cockpit-panel p-4 space-y-3">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-300 font-semibold flex items-center gap-2">
              <History className="w-4 h-4 text-meaven-blue" />
              Recent AI Research Jobs ({jobs.length})
            </span>
            <span className="text-cockpit-muted text-[11px]">
              Click any job to view progress banner
            </span>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {jobs.map((j) => (
              <div
                key={j.id}
                onClick={() => setActiveJobId(j.id)}
                className={`p-3 rounded-lg border text-xs min-w-[240px] max-w-[300px] cursor-pointer transition-all ${
                  activeJobId === j.id
                    ? 'border-[#36668d] bg-[#36668d]/10 text-slate-100'
                    : 'border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between font-mono text-[10px] text-cockpit-muted mb-1">
                  <span>{new Date(j.createdAt).toLocaleDateString()}</span>
                  <span className="text-[#36668d] font-semibold">{formatINR(j.estimatedCost || 0)}</span>
                </div>
                <p className="font-medium line-clamp-1 text-slate-200">&quot;{j.originalInstruction}&quot;</p>
                <div className="flex items-center justify-between font-mono text-[10px] mt-2 pt-1 border-t border-slate-800/80">
                  <span className="text-slate-400">{j.finalShortlistCount || j.candidateCount} candidates</span>
                  <span className="uppercase text-emerald-400">{j.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Research Setup Area */}
      <ResearchSetupArea />

      {/* Alert Notice */}
      {alertMessage && (
        <div className="p-4 bg-meaven-blue/15 border border-meaven-blue/40 rounded-xl text-xs font-semibold text-slate-100 flex items-center gap-3 shadow-md animate-in fade-in duration-200">
          <AlertCircle className="w-5 h-5 text-meaven-blue shrink-0" />
          <span>{alertMessage}</span>
        </div>
      )}

      {/* 4. Filter & Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-cockpit-surface p-4 rounded-xl border border-cockpit-border">
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <Filter className="w-4 h-4 text-cockpit-subtle shrink-0" />
          <span className="text-xs font-semibold text-slate-300 font-mono shrink-0">Status:</span>
          <div className="flex items-center space-x-1 shrink-0">
            {['All', 'DISCOVERED', 'RESEARCHING', 'READY_FOR_REVIEW', 'APPROVED', 'REJECTED', 'ARCHIVED'].map((st) => (
              <button
                key={st}
                onClick={() => setSelectedStatus(st)}
                className={`px-2.5 py-1 rounded text-xs font-medium font-mono transition-colors ${
                  selectedStatus === st
                    ? 'bg-meaven-blue text-white'
                    : 'text-cockpit-muted hover:text-slate-200 bg-cockpit-card border border-cockpit-border'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        <div className="w-full md:w-64 relative shrink-0">
          <Search className="w-3.5 h-3.5 text-cockpit-subtle absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search candidate, city, sector..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-cockpit-bg border border-cockpit-border rounded text-xs text-slate-200 focus:outline-none focus:border-meaven-blue"
          />
        </div>
      </div>

      {/* 5. Executive Candidate List / Table */}
      <div className="cockpit-panel p-0 overflow-hidden border border-cockpit-border rounded-xl">
        {candidates.length === 0 ? (
          <div className="py-12 text-center text-xs text-cockpit-muted">
            No research candidates found matching criteria. Run the AI Research Engine above to discover new candidates.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-cockpit-surface border-b border-cockpit-border text-[11px] font-mono text-cockpit-subtle uppercase">
                  <th className="py-3 px-4">Company</th>
                  <th className="py-3 px-4">Type &amp; Location</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Fit Score</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Researched On</th>
                  <th className="py-3 px-4">Source</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cockpit-border/60">
                {candidates.map((c) => (
                  <tr key={c.id} className="hover:bg-cockpit-card/80 transition-colors group">
                    <td className="py-3 px-4">
                      <div>
                        <div
                          onClick={() => handleOpenResearch(c.id)}
                          className="font-bold text-slate-100 hover:text-meaven-light transition-colors cursor-pointer text-sm flex items-center gap-1.5"
                        >
                          <span>{c.companyName || c.name}</span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          {c.website && (
                            <a
                              href={c.website.startsWith('http') ? c.website : `https://${c.website}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] font-mono text-cockpit-subtle hover:text-meaven-light inline-flex items-center gap-0.5 truncate max-w-[160px]"
                            >
                              {c.domain || c.website} <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                          <span
                            className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded uppercase ${
                              c.verificationStatus === 'VERIFIED'
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                : c.verificationStatus === 'PARTIALLY_VERIFIED'
                                ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                                : c.verificationStatus === 'PARKED_DOMAIN' || c.verificationStatus === 'DOMAIN_MISMATCH' || c.verificationStatus === 'INACTIVE_DOMAIN'
                                ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                                : 'bg-slate-800 text-slate-400 border border-slate-700'
                            }`}
                            title={c.verificationReason || `Verification: ${c.verificationStatus}`}
                          >
                            {c.verificationStatus || 'UNVERIFIED'}
                          </span>
                          {c.partnerOpportunitySignal && (
                            <span
                              className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded cursor-help ${
                                c.partnerOpportunitySignal === 'HIGH'
                                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                                  : c.partnerOpportunitySignal === 'MEDIUM'
                                  ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                                  : c.partnerOpportunitySignal === 'UNKNOWN'
                                  ? 'bg-amber-500/10 text-amber-300/90 border border-amber-500/30'
                                  : c.partnerOpportunitySignal === 'LOW'
                                  ? 'bg-slate-700/50 text-slate-300 border border-slate-700'
                                  : 'bg-slate-800 text-slate-400 border border-slate-700'
                              }`}
                              title={`Partner Opportunity: ${c.partnerOpportunitySignal}\nReason: ${c.partnerOpportunityReason || 'N/A'}\nEvidence Limitation: ${c.evidenceLimitations || 'N/A'}`}
                            >
                              Opp: {c.partnerOpportunitySignal}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-300">
                      <div>{c.companyType || c.industry}</div>
                      <div className="text-[10px] text-cockpit-muted">{c.location || c.city || 'Location N/A'}</div>
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase font-mono ${
                          c.researchStatus === 'APPROVED'
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : c.researchStatus === 'READY_FOR_REVIEW'
                            ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                            : c.researchStatus === 'REJECTED'
                            ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                            : 'bg-meaven-blue/15 text-meaven-blue border border-meaven-blue/30'
                        }`}
                      >
                        {c.researchStatus}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-mono font-bold">
                      <span className="text-meaven-light">{c.fitScore} / 100</span>
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                          c.priority === 'HIGH'
                            ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                            : c.priority === 'MEDIUM'
                            ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                            : 'bg-slate-700/40 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {c.priority}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-slate-300">
                      <div className="font-mono font-semibold text-[11px] text-slate-200">
                        {formatDateTime(c.createdAt || c.discoveredAt || c.discoveredDate)}
                      </div>
                      {c.jobId && jobMap[c.jobId] ? (
                        <div
                          className="text-[10px] text-cockpit-muted font-mono truncate max-w-[140px] cursor-help flex items-center gap-1 mt-0.5"
                          title={`Research Job (${jobMap[c.jobId].modelName || 'AI'}): "${jobMap[c.jobId].originalInstruction}"`}
                        >
                          <span className="text-[#36668d] font-semibold shrink-0">Job:</span>
                          <span className="truncate">&quot;{jobMap[c.jobId].originalInstruction}&quot;</span>
                        </div>
                      ) : c.jobId ? (
                        <div className="text-[10px] text-cockpit-muted font-mono truncate max-w-[140px]" title={`Job ID: ${c.jobId}`}>
                          <span className="text-slate-500">ID: {c.jobId}</span>
                        </div>
                      ) : (
                        <div className="text-[10px] text-cockpit-subtle font-mono">Manual</div>
                      )}
                    </td>

                    <td className="py-3 px-4 text-cockpit-subtle font-mono text-[11px]">
                      {c.source || 'Founder Research'}
                    </td>

                    <td className="py-3 px-4 text-right shrink-0">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenResearch(c.id)}
                          className="px-2.5 py-1 bg-meaven-blue/10 hover:bg-meaven-blue/20 text-meaven-blue border border-meaven-blue/30 rounded text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Open Research</span>
                        </button>

                        <button
                          onClick={() => printResearchDossier(c)}
                          title="Export Meaven Research Dossier (PDF)"
                          className="p-1 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded border border-slate-700 transition-colors cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5 text-meaven-blue" />
                        </button>

                        {c.researchStatus !== 'APPROVED' && (
                          <button
                            onClick={() => handleQuickApprove(c.id)}
                            title="Approve as Company Prospect"
                            className="p-1 text-emerald-400 hover:bg-emerald-500/20 rounded border border-emerald-500/30 transition-colors"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {c.researchStatus !== 'REJECTED' && (
                          <button
                            onClick={() => handleQuickStatusChange(c.id, 'REJECTED')}
                            title="Reject Candidate"
                            className="p-1 text-rose-400 hover:bg-rose-500/20 rounded border border-rose-500/30 transition-colors"
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {c.researchStatus !== 'ARCHIVED' && (
                          <button
                            onClick={() => handleQuickStatusChange(c.id, 'ARCHIVED')}
                            title="Archive Candidate"
                            className="p-1 text-slate-400 hover:bg-slate-700/40 rounded border border-slate-700 transition-colors"
                          >
                            <Archive className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <NewResearchModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        onJobStarted={handleJobStarted}
      />

      <AddCandidateModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={fetchCandidates}
      />

      <ResearchDetailModal
        candidateId={selectedCandidateId}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedCandidateId(null);
        }}
        onRefresh={fetchCandidates}
      />
    </div>
  );
}
