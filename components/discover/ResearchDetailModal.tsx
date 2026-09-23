'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  X,
  Building2,
  Globe,
  MapPin,
  Sparkles,
  Sliders,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Compass,
  Target,
  ExternalLink,
  Plus,
  Save,
  UserCheck,
  Ban,
  Archive,
  Clock,
  FileText,
} from 'lucide-react';
import { ResearchCandidate, CandidateNote, BusinessSignals, ResearchStatus, PriorityLevel, VerificationStatus, PartnerOpportunitySignal } from '@/types';
import { formatDateTime } from '@/lib/utils';
import { printResearchDossier } from '@/lib/exportPdf';

interface ResearchDetailModalProps {
  candidateId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

export const ResearchDetailModal: React.FC<ResearchDetailModalProps> = ({
  candidateId,
  isOpen,
  onClose,
  onRefresh,
}) => {
  const router = useRouter();
  const [candidate, setCandidate] = useState<ResearchCandidate | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Note form state
  const [newNoteText, setNewNoteText] = useState('');
  const [newNoteSource, setNewNoteSource] = useState('');
  const [newNoteSourceUrl, setNewNoteSourceUrl] = useState('');

  // Editable candidate fields
  const [editForm, setEditForm] = useState({
    companyName: '',
    website: '',
    location: '',
    companyType: '',
    industry: '',
    description: '',
    fitScore: 80,
    fitReason: '',
    priority: 'MEDIUM' as PriorityLevel,
    researchStatus: 'DISCOVERED' as ResearchStatus,
    verificationStatus: 'UNVERIFIED' as VerificationStatus,
    verificationReason: '',
    partnerOpportunitySignal: 'UNKNOWN' as PartnerOpportunitySignal,
    partnerOpportunityReason: '',
    evidenceLimitations: '',
    partnerModelSignals: [] as string[],
    founderInvestigationFlags: [] as string[],
    notes: '',
    businessSignals: {
      projectsWorkTypes: '',
      commercialFocus: '',
      residentialFocus: '',
      dnbCapability: '',
      meavenFit: '',
      geographicRelevance: '',
      companySize: '',
      otherSignals: '',
    } as BusinessSignals,
  });

  const fetchCandidateDetails = async (id: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/discover/candidates/${id}`);
      if (res.ok) {
        const data: ResearchCandidate = await res.json();
        setCandidate(data);
        setEditForm({
          companyName: data.companyName || data.name || '',
          website: data.website || '',
          location: data.location || data.city || '',
          companyType: data.companyType || data.industrySegment || 'Architecture',
          industry: data.industry || data.industrySegment || '',
          description: data.description || data.summary || '',
          fitScore: data.fitScore !== undefined ? data.fitScore : (data.aiScore || 80),
          fitReason: data.fitReason || '',
          priority: data.priority || 'MEDIUM',
          researchStatus: data.researchStatus || 'DISCOVERED',
          verificationStatus: data.verificationStatus || 'UNVERIFIED',
          verificationReason: data.verificationReason || '',
          partnerOpportunitySignal: data.partnerOpportunitySignal || 'UNKNOWN',
          partnerOpportunityReason: data.partnerOpportunityReason || '',
          evidenceLimitations: data.evidenceLimitations || '',
          partnerModelSignals: data.partnerModelSignals || [],
          founderInvestigationFlags: data.founderInvestigationFlags || [],
          notes: data.notes || '',
          businessSignals: {
            projectsWorkTypes: data.businessSignals?.projectsWorkTypes || '',
            commercialFocus: data.businessSignals?.commercialFocus || '',
            residentialFocus: data.businessSignals?.residentialFocus || '',
            dnbCapability: data.businessSignals?.dnbCapability || '',
            meavenFit: data.businessSignals?.meavenFit || '',
            geographicRelevance: data.businessSignals?.geographicRelevance || '',
            companySize: data.businessSignals?.companySize || '',
            otherSignals: data.businessSignals?.otherSignals || '',
          },
        });
      }
    } catch {
      console.error('Failed to fetch candidate details');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (candidateId && isOpen) {
      fetchCandidateDetails(candidateId);
    }
  }, [candidateId, isOpen]);

  // Helper to generate dynamic candidate snapshot signals adhering strictly to evidence boundaries
  const snapshot = React.useMemo(() => {
    if (!candidate) {
      return { profileSignals: [], researchSummary: '', openQuestions: [] };
    }

    const profileSignals: string[] = [];
    const openQuestions: string[] = [];
    const seenSignals = new Set<string>();

    const addSignal = (sig: string) => {
      const clean = sig.trim();
      const lower = clean.toLowerCase();
      if (clean && !seenSignals.has(lower)) {
        seenSignals.add(lower);
        profileSignals.push(clean);
      }
    };

    const addQuestion = (q: string) => {
      const clean = q.trim();
      const lower = clean.toLowerCase();
      if (clean && !seenSignals.has(lower)) {
        seenSignals.add(lower);
        openQuestions.push(clean);
      }
    };

    // 1. Location signal
    if (candidate.location || candidate.city) {
      const loc = (candidate.location || candidate.city || '').split(',')[0].trim();
      if (loc) addSignal(loc);
    }

    // 2. Company Type & Industry signals
    const rawText = `${candidate.companyType || ''} ${candidate.industry || ''} ${candidate.summary || ''} ${candidate.description || ''}`.toLowerCase();

    if (rawText.includes('boutique')) addSignal('Boutique');
    if (rawText.includes('architect') || rawText.includes('architecture')) addSignal('Architecture');
    if (rawText.includes('interior')) addSignal('Interior Design');

    // EVIDENCE BOUNDARY: Only add Commercial if NOT listed as UNKNOWN in evidenceList
    const isCommercialUnknown = candidate.evidenceList?.some(ev =>
      ev.status === 'UNKNOWN' && ev.claim.toLowerCase().includes('commercial')
    );
    if ((rawText.includes('commercial') || rawText.includes('office')) && !isCommercialUnknown) {
      addSignal('Commercial');
    }

    // EVIDENCE BOUNDARY: Only add Residential if NOT listed as UNKNOWN in evidenceList
    const isResidentialUnknown = candidate.evidenceList?.some(ev =>
      ev.status === 'UNKNOWN' && ev.claim.toLowerCase().includes('residential')
    );
    if ((rawText.includes('residential') || rawText.includes('villa') || rawText.includes('luxury home')) && !isResidentialUnknown) {
      addSignal('Residential');
    }

    // 3. Extract positive signals from KNOWN / INFERRED evidence claims
    if (candidate.evidenceList && candidate.evidenceList.length > 0) {
      candidate.evidenceList.forEach(ev => {
        if (ev.status === 'KNOWN' || ev.status === 'INFERRED') {
          const text = ev.claim.toLowerCase();
          if ((text.includes('villas') || text.includes('luxury home')) && !seenSignals.has('luxury homes')) {
            addSignal('Luxury Homes');
          }
          if (text.includes('hospitality') || text.includes('hotel')) {
            addSignal('Hospitality');
          }
          if (text.includes('retail') || text.includes('showroom')) {
            addSignal('Retail');
          }
          if (text.includes('corporate') || text.includes('tech office')) {
            addSignal('Corporate Office');
          }
          const isTurnkeyUnknown = candidate.evidenceList?.some(e =>
            e.status === 'UNKNOWN' && (e.claim.toLowerCase().includes('turnkey') || e.claim.toLowerCase().includes('design-and-build'))
          );
          if ((text.includes('turnkey') || text.includes('design-and-build')) && !isTurnkeyUnknown) {
            addSignal('Turnkey Execution');
          }
        }
      });

      // 4. Extract Open Questions from UNKNOWN evidence claims
      candidate.evidenceList.forEach(ev => {
        if (ev.status === 'UNKNOWN') {
          const text = ev.claim.toLowerCase();
          if (text.includes('commercial')) {
            addQuestion('Commercial focus ?');
          }
          if (text.includes('turnkey') || text.includes('design-and-build') || text.includes('execution')) {
            addQuestion('Execution model ?');
          }
          if (text.includes('size') || text.includes('employee') || text.includes('scale') || text.includes('count')) {
            addQuestion('Company scale ?');
          }
          if (text.includes('leadership') || text.includes('contact') || text.includes('person') || text.includes('founder')) {
            addQuestion('Leadership team ?');
          }
          if (text.includes('website') || text.includes('domain') || text.includes('identity')) {
            addQuestion('Website identity ?');
          }
        }
      });
    }

    // Include partnerModelSignals if available
    if (candidate.partnerModelSignals && candidate.partnerModelSignals.length > 0) {
      candidate.partnerModelSignals.forEach(sig => {
        if (!sig.toLowerCase().includes('website')) addSignal(sig);
      });
    }

    // Default open question fallbacks if none were identified from UNKNOWN evidence
    if (openQuestions.length === 0) {
      if (!profileSignals.some(s => s.toLowerCase().includes('turnkey'))) {
        addQuestion('Execution model ?');
      }
      if (!profileSignals.some(s => s.toLowerCase().includes('commercial'))) {
        addQuestion('Commercial project mix ?');
      }
    }

    // 5. Short 1-sentence Research Summary (~20-25 words max)
    let summaryText = '';
    if (candidate.fitReason) {
      let cleanReason = candidate.fitReason.replace(/^\[(INFERRED|KNOWN|UNKNOWN)\]\s*/i, '').trim();
      const firstSentence = cleanReason.split('.')[0].trim();
      const words = firstSentence.split(/\s+/);
      if (words.length > 22) {
        summaryText = words.slice(0, 22).join(' ') + '...';
      } else {
        summaryText = firstSentence.endsWith('.') ? firstSentence : `${firstSentence}.`;
      }
    } else {
      summaryText = `Verified ${candidate.location || 'target area'} ${candidate.companyType || 'design practice'} matching initial research instruction.`;
    }

    return {
      profileSignals: profileSignals.slice(0, 8),
      researchSummary: summaryText,
      openQuestions: openQuestions.slice(0, 5),
    };
  }, [candidate]);

  if (!isOpen || !candidateId) return null;

  const handleSaveWorkspace = async (overrideStatus?: ResearchStatus) => {
    setIsSaving(true);
    setSaveMessage(null);
    try {
      const statusToSave = overrideStatus || editForm.researchStatus;
      const res = await fetch(`/api/discover/candidates/${candidateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editForm,
          researchStatus: statusToSave,
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setCandidate(updated);
        setSaveMessage('Workspace changes saved cleanly.');
        onRefresh();
        setTimeout(() => setSaveMessage(null), 3000);
      } else {
        alert('Failed to save workspace');
      }
    } catch {
      alert('Failed to save workspace');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;

    try {
      const res = await fetch(`/api/discover/candidates/${candidateId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          note: newNoteText,
          source: newNoteSource,
          sourceUrl: newNoteSourceUrl,
          date: new Date().toISOString().split('T')[0],
        }),
      });

      if (res.ok) {
        setNewNoteText('');
        setNewNoteSource('');
        setNewNoteSourceUrl('');
        fetchCandidateDetails(candidateId);
      }
    } catch {
      alert('Failed to add note');
    }
  };

  const handleApprove = async () => {
    if (!confirm(`Approve "${candidate?.companyName}" into Company / Prospect system?`)) return;

    try {
      const res = await fetch(`/api/discover/candidates/${candidateId}/approve`, {
        method: 'POST',
      });
      const data = await res.json();

      if (res.ok && data.success) {
        onRefresh();
        onClose();
        // Redirect to Company Account view directly
        router.push(`/relationships?companyId=${data.companyId}`);
      } else {
        alert(data.error || 'Failed to approve candidate');
      }
    } catch {
      alert('Failed to approve candidate');
    }
  };

  const handleStatusChange = async (newStatus: ResearchStatus) => {
    setEditForm((prev) => ({ ...prev, researchStatus: newStatus }));
    await handleSaveWorkspace(newStatus);
  };

  // Derive Recommended Next Action
  const getRecommendedAction = (): { text: string; alertType: 'success' | 'warning' | 'info' | 'error' } => {
    const vStatus = editForm.verificationStatus;
    const rStatus = editForm.researchStatus;

    if (rStatus === 'APPROVED') {
      return { text: 'Approved — Candidate is active in Company Prospect system.', alertType: 'success' };
    }
    if (rStatus === 'REJECTED' || rStatus === 'ARCHIVED') {
      return { text: 'Candidate is currently archived or rejected.', alertType: 'info' };
    }
    if (vStatus === 'PARKED_DOMAIN' || vStatus === 'INACTIVE_DOMAIN' || vStatus === 'DOMAIN_MISMATCH') {
      return { text: 'Website domain issue detected — verify website identity before founder approval.', alertType: 'error' };
    }
    if (vStatus === 'UNVERIFIED') {
      return { text: 'Website identity needs verification before approval.', alertType: 'warning' };
    }
    if (vStatus === 'PARTIALLY_VERIFIED') {
      return { text: 'Review company and verify execution model before founder outreach.', alertType: 'warning' };
    }
    return { text: 'Ready for founder review & approval.', alertType: 'success' };
  };

  const recommendedAction = getRecommendedAction();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-4xl max-h-[92vh] bg-cockpit-surface border border-cockpit-border rounded-xl shadow-2xl flex flex-col relative overflow-hidden my-auto">
        
        {/* TOP HEADER BAR */}
        <div className="px-4 py-3.5 border-b border-cockpit-border bg-cockpit-card flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-meaven-blue/20 border border-meaven-blue/40 flex items-center justify-center text-meaven-blue font-bold text-sm shrink-0">
              <Building2 className="w-5 h-5" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-100">
                  {candidate?.companyName || 'Loading Candidate...'}
                </h2>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase font-mono ${
                    editForm.researchStatus === 'APPROVED'
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : editForm.researchStatus === 'READY_FOR_REVIEW'
                      ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      : editForm.researchStatus === 'REJECTED'
                      ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                      : 'bg-meaven-blue/15 text-meaven-blue border border-meaven-blue/30'
                  }`}
                >
                  {editForm.researchStatus}
                </span>
              </div>
              <p className="text-xs text-cockpit-muted font-mono flex items-center gap-2 mt-0.5 flex-wrap">
                <span>{candidate?.companyType}</span>
                <span>•</span>
                <span>{candidate?.location}</span>
                {candidate?.website && (
                  <>
                    <span>•</span>
                    <a
                      href={candidate.website.startsWith('http') ? candidate.website : `https://${candidate.website}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-meaven-light hover:underline flex items-center gap-0.5"
                    >
                      {candidate.domain || candidate.website} <ExternalLink className="w-3 h-3" />
                    </a>
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {saveMessage && (
              <span className="text-xs text-emerald-400 font-mono flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> {saveMessage}
              </span>
            )}

            <button
              onClick={() => handleSaveWorkspace()}
              disabled={isSaving}
              className="px-3 py-1.5 bg-meaven-blue hover:bg-meaven-hover text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
            </button>

            {candidate && (
              <button
                onClick={() => printResearchDossier(candidate)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Export Meaven Research Dossier as PDF"
              >
                <FileText className="w-3.5 h-3.5 text-meaven-blue" />
                <span>Export PDF</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 text-cockpit-subtle hover:text-white bg-cockpit-surface border border-cockpit-border rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* MODAL SCROLLABLE BODY */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-5 text-xs flex-1">
          {isLoading ? (
            <div className="py-16 text-center text-cockpit-muted">Loading research candidate workspace...</div>
          ) : (
            <>
              {/* ================================================== */}
              {/* TIER 1 — FOUNDER SNAPSHOT (MUST SEE IMMEDIATELY) */}
              {/* ================================================== */}
              <div className="bg-slate-900 border border-cockpit-border rounded-xl p-4 sm:p-5 space-y-4 shadow-lg">
                
                {/* SNAPSHOT HEADER BADGES ROW */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-cockpit-border/60 pb-3.5">
                  <div className="flex items-center gap-2 font-mono text-xs font-bold text-slate-100 uppercase tracking-wider">
                    <Sparkles className="w-4 h-4 text-meaven-blue" />
                    <span>FOUNDER SNAPSHOT</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* VERIFICATION BADGE */}
                    <div
                      title={editForm.verificationReason || 'Domain verification state'}
                      className={`px-2.5 py-1 rounded text-[11px] font-bold font-mono uppercase flex items-center gap-1 border ${
                        editForm.verificationStatus === 'VERIFIED'
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                          : editForm.verificationStatus === 'PARTIALLY_VERIFIED'
                          ? 'bg-blue-500/15 text-blue-300 border-blue-500/40'
                          : editForm.verificationStatus === 'PARKED_DOMAIN'
                          ? 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                          : 'bg-rose-500/15 text-rose-300 border-rose-500/40'
                      }`}
                    >
                      <span>VERIFICATION: {editForm.verificationStatus.replace('_', ' ')}</span>
                    </div>

                    {/* PARTNER OPPORTUNITY SIGNAL BADGE */}
                    <div
                      title={editForm.partnerOpportunityReason || 'Partner opportunity signal'}
                      className={`px-2.5 py-1 rounded text-[11px] font-bold font-mono uppercase flex items-center gap-1 border ${
                        editForm.partnerOpportunitySignal === 'HIGH'
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                          : editForm.partnerOpportunitySignal === 'MEDIUM'
                          ? 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                          : editForm.partnerOpportunitySignal === 'UNKNOWN'
                          ? 'bg-amber-500/10 text-amber-300/90 border-amber-500/30'
                          : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}
                    >
                      <Target className="w-3.5 h-3.5" />
                      <span>OPPORTUNITY: {editForm.partnerOpportunitySignal}</span>
                    </div>

                    {/* FIT SCORE */}
                    <div className="px-2.5 py-1 bg-meaven-blue/15 border border-meaven-blue/40 text-meaven-light rounded text-[11px] font-bold font-mono">
                      FIT SCORE: {editForm.fitScore}/100
                    </div>

                    {/* PRIORITY */}
                    <div className={`px-2.5 py-1 rounded text-[11px] font-bold font-mono uppercase border ${
                      editForm.priority === 'HIGH'
                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                        : editForm.priority === 'MEDIUM'
                        ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}>
                      PRIORITY: {editForm.priority}
                    </div>
                  </div>
                </div>

                {/* LAYER A: COMPANY AT A GLANCE */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-meaven-blue block">
                    COMPANY AT A GLANCE
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {snapshot.profileSignals.map((chip, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 bg-meaven-blue/15 border border-meaven-blue/30 text-meaven-light text-[11px] font-semibold rounded font-mono"
                      >
                        {chip}
                      </span>
                    ))}
                  </div>
                </div>

                {/* LAYER B: RESEARCH SUMMARY */}
                <div className="space-y-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-slate-400 block">
                    RESEARCH SUMMARY
                  </span>
                  <p className="text-xs text-slate-200 leading-relaxed font-medium">
                    {snapshot.researchSummary}
                  </p>
                </div>

                {/* LAYER C: OPEN QUESTIONS */}
                {snapshot.openQuestions && snapshot.openQuestions.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-amber-400/90 block">
                      OPEN QUESTIONS
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {snapshot.openQuestions.map((q, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 bg-amber-950/20 border border-amber-500/30 text-amber-300 text-[11px] font-semibold rounded font-mono"
                        >
                          {q}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* FOUNDER INVESTIGATION FLAGS */}
                <div className="space-y-2">
                  <span className="text-[11px] font-mono uppercase tracking-wider font-bold text-amber-400 block">
                    FOUNDER INVESTIGATION
                  </span>
                  {candidate?.founderInvestigationFlags && candidate.founderInvestigationFlags.length > 0 ? (
                    <div className="space-y-1.5">
                      {candidate.founderInvestigationFlags.map((flag, idx) => (
                        <div key={idx} className="p-2.5 bg-amber-950/20 border border-amber-500/30 rounded text-xs text-amber-200 flex items-start gap-2">
                          <span className="shrink-0 text-amber-400">⚠️</span>
                          <span>{flag.replace(/^⚠️\s*/, '')}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-2.5 bg-emerald-950/20 border border-emerald-500/30 rounded text-xs text-emerald-300 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>No major investigation flags identified from available public evidence.</span>
                    </div>
                  )}
                </div>

                {/* RECOMMENDED NEXT ACTION BANNER & PRIMARY CONTROLS */}
                <div className="pt-2 border-t border-cockpit-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className={`p-2.5 rounded-lg border flex items-center gap-2 text-xs font-medium flex-1 ${
                    recommendedAction.alertType === 'success' ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300' :
                    recommendedAction.alertType === 'warning' ? 'bg-amber-950/20 border-amber-500/30 text-amber-200' :
                    recommendedAction.alertType === 'error' ? 'bg-rose-950/20 border-rose-500/30 text-rose-300' :
                    'bg-slate-800 border-slate-700 text-slate-300'
                  }`}>
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <div>
                      <span className="font-bold font-mono uppercase text-[10px] block opacity-80">Recommended Action</span>
                      <span>{recommendedAction.text}</span>
                    </div>
                  </div>

                  {/* APPROVAL & DECISION BUTTONS */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleStatusChange('REJECTED')}
                      className={`px-3 py-2 rounded-lg text-xs font-semibold font-mono border transition-colors flex items-center gap-1 cursor-pointer ${
                        editForm.researchStatus === 'REJECTED'
                          ? 'bg-rose-500 text-white border-rose-500'
                          : 'bg-cockpit-card border-cockpit-border text-rose-400 hover:bg-rose-950/30'
                      }`}
                    >
                      <Ban className="w-3.5 h-3.5" /> Reject
                    </button>
                    <button
                      onClick={() => handleStatusChange('ARCHIVED')}
                      className={`px-3 py-2 rounded-lg text-xs font-semibold font-mono border transition-colors flex items-center gap-1 cursor-pointer ${
                        editForm.researchStatus === 'ARCHIVED'
                          ? 'bg-slate-700 text-white border-slate-600'
                          : 'bg-cockpit-card border-cockpit-border text-slate-400 hover:text-white'
                      }`}
                    >
                      <Archive className="w-3.5 h-3.5" /> Archive
                    </button>
                    <button
                      onClick={handleApprove}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-lg flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>Approve as Prospect</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* ================================================== */}
              {/* ORIGINATING RESEARCH CONTEXT (COMPACT BOX) */}
              {/* ================================================== */}
              <div className="p-3 bg-slate-900/80 border border-[#36668d]/30 rounded-lg space-y-1">
                <div className="flex items-center justify-between text-[11px] font-mono text-[#36668d] font-semibold">
                  <span className="flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5" /> Originating Research Instruction
                  </span>
                  <span>
                    {candidate?.jobId ? `Job ID: ${candidate.jobId}` : 'Manual Entry'}
                    {candidate && (candidate.createdAt || candidate.discoveredAt) && (
                      <span className="ml-2 text-slate-400">
                        • {formatDateTime(candidate.createdAt || candidate.discoveredAt)}
                      </span>
                    )}
                  </span>
                </div>
                <p className="text-xs text-slate-300 italic">
                  &quot;{candidate?.originatingInstruction || 'Candidate researched via Research Workbench.'}&quot;
                </p>
              </div>

              {/* SECTION A: Company Snapshot */}
              <div className="cockpit-panel p-4 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-meaven-blue font-mono">
                  A. Company Snapshot
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] text-cockpit-muted font-mono block mb-1">Company Name</label>
                    <input
                      type="text"
                      value={editForm.companyName}
                      onChange={(e) => setEditForm({ ...editForm, companyName: e.target.value })}
                      className="w-full px-3 py-1.5 bg-cockpit-bg border border-cockpit-border rounded text-xs text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-cockpit-muted font-mono block mb-1">Website</label>
                    <input
                      type="text"
                      value={editForm.website}
                      onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                      className="w-full px-3 py-1.5 bg-cockpit-bg border border-cockpit-border rounded text-xs text-slate-100 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-cockpit-muted font-mono block mb-1">Location / City</label>
                    <input
                      type="text"
                      value={editForm.location}
                      onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                      className="w-full px-3 py-1.5 bg-cockpit-bg border border-cockpit-border rounded text-xs text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-cockpit-muted font-mono block mb-1">Company Type</label>
                    <input
                      type="text"
                      value={editForm.companyType}
                      onChange={(e) => setEditForm({ ...editForm, companyType: e.target.value, industry: e.target.value })}
                      className="w-full px-3 py-1.5 bg-cockpit-bg border border-cockpit-border rounded text-xs text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-cockpit-muted font-mono block mb-1">Industry / Sector</label>
                    <input
                      type="text"
                      value={editForm.industry}
                      onChange={(e) => setEditForm({ ...editForm, industry: e.target.value })}
                      className="w-full px-3 py-1.5 bg-cockpit-bg border border-cockpit-border rounded text-xs text-slate-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-cockpit-muted font-mono block mb-1">Company Overview &amp; Description</label>
                  <textarea
                    rows={2}
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    className="w-full px-3 py-1.5 bg-cockpit-bg border border-cockpit-border rounded text-xs text-slate-100"
                  />
                </div>
              </div>

              {/* SECTION B: Why This Company? */}
              <div className="cockpit-panel p-4 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-meaven-blue font-mono">
                  B. Strategic Fit &amp; Reasoning
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[11px] text-cockpit-muted font-mono block mb-1">
                      Fit Score ({editForm.fitScore} / 100)
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={editForm.fitScore}
                      onChange={(e) => setEditForm({ ...editForm, fitScore: Number(e.target.value) })}
                      className="w-full accent-meaven-blue cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-cockpit-muted font-mono block mb-1">Priority Level</label>
                    <select
                      value={editForm.priority}
                      onChange={(e) => setEditForm({ ...editForm, priority: e.target.value as PriorityLevel })}
                      className="w-full px-3 py-1.5 bg-cockpit-bg border border-cockpit-border rounded text-xs text-slate-100"
                    >
                      <option value="HIGH">HIGH Priority</option>
                      <option value="MEDIUM">MEDIUM Priority</option>
                      <option value="LOW">LOW Priority</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] text-cockpit-muted font-mono block mb-1">Research Status</label>
                    <select
                      value={editForm.researchStatus}
                      onChange={(e) => setEditForm({ ...editForm, researchStatus: e.target.value as ResearchStatus })}
                      className="w-full px-3 py-1.5 bg-cockpit-bg border border-cockpit-border rounded text-xs text-slate-100"
                    >
                      <option value="DISCOVERED">DISCOVERED</option>
                      <option value="RESEARCHING">RESEARCHING</option>
                      <option value="RESEARCHED">RESEARCHED</option>
                      <option value="READY_FOR_REVIEW">READY_FOR_REVIEW</option>
                      <option value="APPROVED">APPROVED</option>
                      <option value="REJECTED">REJECTED</option>
                      <option value="ARCHIVED">ARCHIVED</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-cockpit-muted font-mono block mb-1">Fit Reason &amp; Strategic Alignment</label>
                  <textarea
                    rows={2}
                    placeholder="Why is this company worth investigating? Key capabilities or alignment..."
                    value={editForm.fitReason}
                    onChange={(e) => setEditForm({ ...editForm, fitReason: e.target.value })}
                    className="w-full px-3 py-1.5 bg-cockpit-bg border border-cockpit-border rounded text-xs text-slate-100"
                  />
                </div>
              </div>

              {/* SECTION C: Business Signals */}
              <div className="cockpit-panel p-4 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-meaven-blue font-mono">
                  C. Structured Business Signals
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] text-cockpit-muted font-mono block mb-1">Projects / Work Types</label>
                    <input
                      type="text"
                      placeholder="e.g. Corporate HQs, Tech Offices"
                      value={editForm.businessSignals.projectsWorkTypes || ''}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          businessSignals: { ...editForm.businessSignals, projectsWorkTypes: e.target.value },
                        })
                      }
                      className="w-full px-3 py-1.5 bg-cockpit-bg border border-cockpit-border rounded text-xs text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-cockpit-muted font-mono block mb-1">Commercial Focus</label>
                    <input
                      type="text"
                      placeholder="e.g. 80% Commercial Office"
                      value={editForm.businessSignals.commercialFocus || ''}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          businessSignals: { ...editForm.businessSignals, commercialFocus: e.target.value },
                        })
                      }
                      className="w-full px-3 py-1.5 bg-cockpit-bg border border-cockpit-border rounded text-xs text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-cockpit-muted font-mono block mb-1">Residential Focus</label>
                    <input
                      type="text"
                      placeholder="e.g. 20% Luxury Villas"
                      value={editForm.businessSignals.residentialFocus || ''}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          businessSignals: { ...editForm.businessSignals, residentialFocus: e.target.value },
                        })
                      }
                      className="w-full px-3 py-1.5 bg-cockpit-bg border border-cockpit-border rounded text-xs text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-cockpit-muted font-mono block mb-1">D&amp;B Capability</label>
                    <input
                      type="text"
                      placeholder="e.g. Full Turnkey Design + Build"
                      value={editForm.businessSignals.dnbCapability || ''}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          businessSignals: { ...editForm.businessSignals, dnbCapability: e.target.value },
                        })
                      }
                      className="w-full px-3 py-1.5 bg-cockpit-bg border border-cockpit-border rounded text-xs text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-cockpit-muted font-mono block mb-1">Potential Meaven Service Fit</label>
                    <input
                      type="text"
                      placeholder="e.g. Joinery, Architectural Millwork"
                      value={editForm.businessSignals.meavenFit || ''}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          businessSignals: { ...editForm.businessSignals, meavenFit: e.target.value },
                        })
                      }
                      className="w-full px-3 py-1.5 bg-cockpit-bg border border-cockpit-border rounded text-xs text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-cockpit-muted font-mono block mb-1">Company Size &amp; Scale</label>
                    <input
                      type="text"
                      placeholder="e.g. 25-50 Architects &amp; PMs"
                      value={editForm.businessSignals.companySize || ''}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          businessSignals: { ...editForm.businessSignals, companySize: e.target.value },
                        })
                      }
                      className="w-full px-3 py-1.5 bg-cockpit-bg border border-cockpit-border rounded text-xs text-slate-100"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION D: Source & Evidence Verification */}
              <div className="cockpit-panel p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-meaven-blue font-mono">
                    D. Source &amp; Research Evidence ({candidate?.evidenceList?.length || 0} claims)
                  </h3>
                  <span className="text-[10px] text-cockpit-muted font-mono">
                    Separates KNOWN facts, INFERRED signals, and UNKNOWN metrics
                  </span>
                </div>

                {/* Evidence List */}
                <div className="space-y-2">
                  {!candidate?.evidenceList || candidate.evidenceList.length === 0 ? (
                    <div className="p-3 bg-cockpit-bg border border-cockpit-border rounded text-cockpit-muted text-xs">
                      No explicit evidence claims recorded. Web source: {candidate?.sourceUrl || 'Founder Research'}
                    </div>
                  ) : (
                    candidate.evidenceList.map((ev, i) => (
                      <div key={i} className="p-3 bg-cockpit-bg border border-cockpit-border rounded flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
                                ev.status === 'KNOWN'
                                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                  : ev.status === 'INFERRED'
                                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                                  : 'bg-slate-800 text-slate-400 border border-slate-700'
                              }`}
                            >
                              {ev.status}
                            </span>
                            <span className="text-slate-200 text-xs font-medium">{ev.claim}</span>
                          </div>
                          {ev.sourceTitle && (
                            <p className="text-[11px] text-cockpit-muted">Source: {ev.sourceTitle}</p>
                          )}
                        </div>

                        {ev.sourceUrl && (
                          <a
                            href={ev.sourceUrl.startsWith('http') ? ev.sourceUrl : `https://${ev.sourceUrl}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-meaven-light hover:underline text-[11px] font-mono flex items-center gap-1 shrink-0"
                          >
                            Verify Link <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* SECTION E: Dated Research Notes */}
              <div className="cockpit-panel p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-meaven-blue font-mono">
                    E. Dated Research Log ({candidate?.candidateNotes?.length || 0} entries)
                  </h3>
                </div>

                {/* Add New Note Form */}
                <form onSubmit={handleAddNote} className="p-3 bg-cockpit-bg border border-cockpit-border rounded-lg space-y-2">
                  <textarea
                    rows={2}
                    required
                    placeholder="Add dated research note, project update, or key finding..."
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    className="w-full px-3 py-1.5 bg-cockpit-surface border border-cockpit-border rounded text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-meaven-blue"
                  />
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <input
                        type="text"
                        placeholder="Source (Optional)"
                        value={newNoteSource}
                        onChange={(e) => setNewNoteSource(e.target.value)}
                        className="px-2.5 py-1 bg-cockpit-surface border border-cockpit-border rounded text-xs text-slate-200"
                      />
                      <input
                        type="text"
                        placeholder="Source URL (Optional)"
                        value={newNoteSourceUrl}
                        onChange={(e) => setNewNoteSourceUrl(e.target.value)}
                        className="px-2.5 py-1 bg-cockpit-surface border border-cockpit-border rounded text-xs text-slate-200 font-mono"
                      />
                    </div>
                    <button
                      type="submit"
                      className="px-3 py-1 bg-meaven-blue hover:bg-meaven-hover text-white text-xs font-semibold rounded flex items-center gap-1 shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Note Entry</span>
                    </button>
                  </div>
                </form>

                {/* Existing Notes Timeline */}
                <div className="space-y-2">
                  {!candidate?.candidateNotes || candidate.candidateNotes.length === 0 ? (
                    <div className="py-4 text-center text-cockpit-muted border border-dashed border-cockpit-border rounded">
                      No dated research entries logged yet.
                    </div>
                  ) : (
                    candidate.candidateNotes.map((note) => (
                      <div key={note.id} className="p-3 bg-cockpit-card border border-cockpit-border rounded space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-mono">
                          <span className="text-meaven-light font-semibold flex items-center gap-1">
                            <Clock className="w-3 h-3 text-meaven-blue" /> {note.date}
                          </span>
                          {note.source && (
                            <span className="text-cockpit-subtle">Source: {note.source}</span>
                          )}
                        </div>
                        <p className="text-xs text-slate-200">{note.note}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* SECTION F: Decision & Actions */}
              <div className="cockpit-panel p-4 border-2 border-meaven-blue/30 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-100 font-mono">
                    F. Founder Decision &amp; Qualification State
                  </h3>
                  <span className="text-xs text-cockpit-muted">
                    Preserves research permanently regardless of status
                  </span>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-cockpit-border">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-300 font-semibold font-mono">State:</span>
                    <button
                      onClick={() => handleStatusChange('READY_FOR_REVIEW')}
                      className={`px-3 py-1.5 rounded text-xs font-semibold font-mono transition-colors ${
                        editForm.researchStatus === 'READY_FOR_REVIEW'
                          ? 'bg-amber-500 text-white'
                          : 'bg-cockpit-card border border-cockpit-border text-slate-300 hover:text-white'
                      }`}
                    >
                      Ready for Review
                    </button>
                    <button
                      onClick={() => handleStatusChange('REJECTED')}
                      className={`px-3 py-1.5 rounded text-xs font-semibold font-mono transition-colors flex items-center gap-1 ${
                        editForm.researchStatus === 'REJECTED'
                          ? 'bg-rose-500 text-white'
                          : 'bg-cockpit-card border border-cockpit-border text-rose-400 hover:text-white'
                      }`}
                    >
                      <Ban className="w-3.5 h-3.5" /> Reject
                    </button>
                    <button
                      onClick={() => handleStatusChange('ARCHIVED')}
                      className={`px-3 py-1.5 rounded text-xs font-semibold font-mono transition-colors flex items-center gap-1 ${
                        editForm.researchStatus === 'ARCHIVED'
                          ? 'bg-slate-700 text-white'
                          : 'bg-cockpit-card border border-cockpit-border text-slate-400 hover:text-white'
                      }`}
                    >
                      <Archive className="w-3.5 h-3.5" /> Archive
                    </button>
                  </div>

                  <button
                    onClick={handleApprove}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-lg flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>Approve as Company Prospect</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
