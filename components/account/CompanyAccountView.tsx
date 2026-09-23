'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Building2,
  Users,
  Target,
  Activity as ActivityIcon,
  Search,
  Sparkles,
  ExternalLink,
  Clock,
  CheckCircle2,
  Mail,
  Phone,
  Plus,
  Trash2,
  Edit,
  ShieldAlert,
  X,
  MessageSquarePlus,
  FileText,
  Linkedin,
  ShieldCheck,
} from 'lucide-react';
import {
  Company,
  Relationship,
  Contact,
  Opportunity,
  Interaction,
  Research,
  Intelligence,
  ProjectLink,
} from '@/types';
import { InteractionModal } from '@/components/common/InteractionModal';
import { AddContactModal } from '@/components/common/AddContactModal';
import { AddOpportunityModal } from '@/components/common/AddOpportunityModal';
import { formatINR } from '@/lib/utils';

interface CompanyAccountViewProps {
  company: Company;
  relationship: Relationship;
  contacts: Contact[];
  opportunities: Opportunity[];
  interactions: Interaction[];
  research?: Research | null;
  candidateResearch?: any;
  intelligence?: Intelligence | null;
  projectLinks?: ProjectLink[];
  onClose?: () => void;
  onRefresh?: () => void;
}

type TabType =
  | 'overview'
  | 'contacts'
  | 'opportunities'
  | 'activity'
  | 'research'
  | 'intelligence'
  | 'projectLinks';

export const CompanyAccountView: React.FC<CompanyAccountViewProps> = ({
  company,
  relationship,
  contacts = [],
  opportunities = [],
  interactions = [],
  research,
  candidateResearch,
  intelligence,
  projectLinks = [],
  onClose,
  onRefresh,
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlTab = searchParams ? (searchParams.get('tab') as TabType) : null;

  const [activeTab, setActiveTab] = useState<TabType>(urlTab || 'overview');

  useEffect(() => {
    if (urlTab) {
      setActiveTab(urlTab);
    }
  }, [urlTab]);

  const handleTabChange = (newTab: TabType) => {
    setActiveTab(newTab);
    router.push(`/relationships?companyId=${company.id}&tab=${newTab}`);
  };

  // Modals for CRUD inside Account View
  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);

  const [showAddOppModal, setShowAddOppModal] = useState(false);
  const [editingOpportunity, setEditingOpportunity] = useState<Opportunity | null>(null);

  const [showEditCompanyModal, setShowEditCompanyModal] = useState(false);
  const [showAddInteractionModal, setShowAddInteractionModal] = useState(false);

  // Company Notes inline edit state
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [companyNotesText, setCompanyNotesText] = useState(relationship.relationshipNotes || '');

  useEffect(() => {
    setCompanyNotesText(relationship.relationshipNotes || '');
  }, [relationship.relationshipNotes]);

  const [relStatus, setRelStatus] = useState(relationship.status);
  const [relTemp, setRelTemp] = useState(relationship.temperature);
  const [usersList, setUsersList] = useState<{ id: string; name: string; email: string; role: string }[]>([]);
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string; email: string; role: string } | null>(null);

  useEffect(() => {
    setRelStatus(relationship.status);
    setRelTemp(relationship.temperature);
  }, [relationship.status, relationship.temperature]);

  useEffect(() => {
    fetch('/api/users')
      .then((res) => res.json())
      .then((data) => {
        if (data.users) setUsersList(data.users);
        if (data.currentUser) setCurrentUser(data.currentUser);
      })
      .catch(() => {});
  }, []);

  const [editCompForm, setEditCompForm] = useState({
    name: company.name,
    type: company.type,
    city: company.city,
    domain: company.domain,
    website: company.website,
    employeeCount: company.employeeCount,
  });

  const handleUpdateRelationship = async (newStatus: string, newTemp: string) => {
    try {
      const res = await fetch('/api/relationships', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: company.id,
          status: newStatus,
          temperature: newTemp,
        }),
      });
      if (res.ok && onRefresh) onRefresh();
    } catch {
      alert('Failed to update relationship state');
    }
  };

  const handleUpdateOwner = async (newOwner: string) => {
    try {
      const res = await fetch('/api/relationships', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: company.id,
          owner: newOwner,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || 'Failed to update company owner');
        return;
      }
      if (onRefresh) onRefresh();
    } catch {
      alert('Failed to update company owner');
    }
  };

  const handleSaveCompanyNotes = async () => {
    try {
      const res = await fetch('/api/relationships', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: company.id,
          relationshipNotes: companyNotesText,
        }),
      });
      if (res.ok) {
        setIsEditingNotes(false);
        if (onRefresh) onRefresh();
      }
    } catch {
      alert('Failed to save company notes');
    }
  };

  const handleDeleteContact = async (id: string) => {
    if (!confirm('Are you sure you want to deactivate this contact?')) return;
    try {
      const res = await fetch(`/api/contacts/${id}`, { method: 'DELETE' });
      if (res.ok && onRefresh) onRefresh();
    } catch {
      alert('Failed to deactivate contact');
    }
  };

  const handleDeleteOpp = async (id: string) => {
    if (!confirm('Are you sure you want to move this opportunity to Closed Lost / Archived?')) return;
    try {
      const res = await fetch(`/api/opportunities/${id}`, { method: 'DELETE' });
      if (res.ok && onRefresh) onRefresh();
    } catch {
      alert('Failed to archive opportunity');
    }
  };

  const handleEditCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/companies/${company.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editCompForm),
      });
      if (res.ok) {
        setShowEditCompanyModal(false);
        if (onRefresh) onRefresh();
      }
    } catch {
      alert('Failed to update company');
    }
  };

  const handleArchiveCompany = async () => {
    if (!confirm(`Are you sure you want to archive "${company.name}"?`)) return;
    try {
      const res = await fetch(`/api/companies/${company.id}`, { method: 'DELETE' });
      if (res.ok && onClose) onClose();
    } catch {
      alert('Failed to archive company');
    }
  };

  const latestInteraction = interactions.length > 0 ? interactions[0] : null;
  const activeOpportunities = opportunities.filter((o) => o.stage !== 'Closed Won' && o.stage !== 'Closed Lost');
  const totalPipelineValue = activeOpportunities.reduce((acc, o) => acc + (o.estimatedValueAmount || 0), 0);

  const tabs: { id: TabType; label: string; icon: React.ElementType }[] = [
    { id: 'overview', label: 'Overview', icon: Building2 },
    { id: 'contacts', label: `Contacts (${contacts.length})`, icon: Users },
    { id: 'opportunities', label: `Opportunities (${opportunities.length})`, icon: Target },
    { id: 'activity', label: `Activity (${interactions.length})`, icon: ActivityIcon },
    { id: 'research', label: 'AI Research', icon: Search },
    { id: 'intelligence', label: 'Intelligence', icon: Sparkles },
    { id: 'projectLinks', label: `Project Links (${projectLinks.length})`, icon: ExternalLink },
  ];

  return (
    <>
      <div className="cockpit-panel overflow-hidden border border-cockpit-border bg-cockpit-surface rounded-xl flex flex-col">
        {/* Company Header Banner */}
        <div className="p-6 bg-gradient-to-r from-cockpit-surface via-cockpit-surface to-meaven-blue/10 border-b border-cockpit-border relative">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-meaven-blue/20 border border-meaven-blue/40 flex items-center justify-center text-meaven-blue font-extrabold text-lg shadow-glow-meaven">
                {company.logoInitials}
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h2 className="text-xl font-bold text-slate-100">{company.name}</h2>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded badge-meaven">
                    {company.type}
                  </span>

                  {/* Editable Status Dropdown */}
                  <select
                    value={relStatus}
                    onChange={(e) => {
                      setRelStatus(e.target.value as any);
                      handleUpdateRelationship(e.target.value, relTemp);
                    }}
                    className="text-xs font-semibold px-2.5 py-1 rounded uppercase bg-cockpit-bg border border-cockpit-border text-slate-200 focus:outline-none focus:border-meaven-blue cursor-pointer"
                  >
                    <option value="Prospect">Prospect</option>
                    <option value="Opportunity">Opportunity</option>
                    <option value="Meeting">Meeting</option>
                    <option value="Active Partner">Active Partner</option>
                    <option value="Strategic Partner">Strategic Partner</option>
                  </select>
                </div>

                <div className="flex items-center gap-4 text-xs text-cockpit-muted font-mono">
                  <span>{company.city}</span>
                  <span>•</span>
                  <span>{company.employeeCount} team</span>
                  <span>•</span>
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noreferrer"
                    className="text-meaven-blue hover:underline flex items-center gap-1"
                  >
                    {company.domain || company.website} <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              {/* Editable Temperature Dropdown */}
              <div className="p-2 bg-cockpit-bg border border-cockpit-border rounded-lg text-right font-mono">
                <div className="text-[10px] text-cockpit-subtle uppercase">Relationship Temp</div>
                <select
                  value={relTemp}
                  onChange={(e) => {
                    setRelTemp(e.target.value as any);
                    handleUpdateRelationship(relStatus, e.target.value);
                  }}
                  className="text-xs font-bold bg-transparent text-slate-100 focus:outline-none cursor-pointer"
                >
                  <option value="Hot" className="bg-cockpit-surface text-emerald-400">🔥 Hot</option>
                  <option value="Warm" className="bg-cockpit-surface text-amber-400">⚡ Warm</option>
                  <option value="Cold" className="bg-cockpit-surface text-sky-400">❄️ Cold</option>
                </select>
              </div>

              <button
                onClick={() => setShowAddInteractionModal(true)}
                className="px-3 py-2 bg-meaven-blue hover:bg-meaven-hover text-white text-xs font-semibold rounded-lg flex items-center gap-1 shadow-md"
              >
                <MessageSquarePlus className="w-4 h-4" />
                <span>Log Interaction</span>
              </button>

              <button
                onClick={() => setShowEditCompanyModal(true)}
                className="px-3 py-2 bg-cockpit-bg border border-cockpit-border hover:bg-cockpit-hover text-xs font-medium text-slate-300 rounded-lg flex items-center gap-1"
              >
                <Edit className="w-3.5 h-3.5 text-meaven-blue" />
                <span>Edit Company</span>
              </button>

              <button
                onClick={handleArchiveCompany}
                className="px-3 py-2 bg-rose-500/10 border border-rose-500/30 hover:bg-rose-500/20 text-xs font-medium text-rose-400 rounded-lg flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Archive</span>
              </button>

              {onClose && (
                <button
                  onClick={onClose}
                  className="px-3.5 py-2 bg-cockpit-bg border border-cockpit-border hover:bg-cockpit-hover text-xs font-medium text-slate-300 rounded-lg"
                >
                  Back to List
                </button>
              )}
            </div>
          </div>

          {/* 7 Tab Navigation Bar */}
          <div className="flex items-center space-x-2 overflow-x-auto mt-6 pt-4 border-t border-cockpit-border/60 scrollbar-none">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-meaven-blue text-white shadow-glow-meaven'
                      : 'text-cockpit-muted hover:text-slate-200 hover:bg-cockpit-card border border-transparent'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content Area */}
        <div className="p-6 bg-cockpit-bg/40 min-h-[380px]">
          {/* TAB 1: OVERVIEW — 4 CLEAR SECTIONS */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left 2 Columns */}
              <div className="lg:col-span-2 space-y-6">
                {/* SECTION 1: MANDATORY NEXT ACTION & CURRENT SITUATION */}
                <div className="cockpit-card p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-cockpit-border pb-3">
                    <h3 className="text-xs font-bold text-meaven-blue uppercase tracking-wider flex items-center gap-2">
                      <Clock className="w-4 h-4 text-meaven-blue" />
                      Current Situation & Next Action
                    </h3>
                    <span className="font-mono text-xs text-slate-400">
                      Due Date: <strong className="text-slate-200">{relationship.nextActionDate || 'Not Set'}</strong>
                    </span>
                  </div>

                  <div className="p-4 bg-meaven-blue/10 border border-meaven-blue/30 rounded-xl space-y-1">
                    <div className="text-[11px] font-bold text-meaven-light uppercase tracking-wider">
                      Next Action Scheduled
                    </div>
                    <p className="text-sm font-semibold text-slate-100 leading-relaxed">
                      {relationship.nextAction || 'No active next action recorded.'}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    <div className="p-3 bg-cockpit-bg border border-cockpit-border rounded-lg text-xs">
                      <span className="text-cockpit-muted block mb-1">Active Commercial Pipeline</span>
                      <span className="text-base font-bold text-emerald-400">
                        {formatINR(totalPipelineValue)}
                      </span>
                      <span className="text-cockpit-subtle block mt-0.5 font-mono">
                        ({activeOpportunities.length} active opportunities)
                      </span>
                    </div>

                    <div className="p-3 bg-cockpit-bg border border-cockpit-border rounded-lg text-xs">
                      <span className="text-cockpit-muted block mb-1">Last Interaction Summary</span>
                      <span className="text-slate-200 font-medium line-clamp-2">
                        {latestInteraction ? `${latestInteraction.date}: ${latestInteraction.summary}` : 'No interaction logged yet.'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* SECTION 2: PERMANENT COMPANY NOTES */}
                <div className="cockpit-card p-5 space-y-3">
                  <div className="flex items-center justify-between border-b border-cockpit-border pb-3">
                    <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                      <FileText className="w-4 h-4 text-amber-400" />
                      Company Notes (Permanent Founder Context)
                    </h3>
                    {!isEditingNotes ? (
                      <button
                        onClick={() => setIsEditingNotes(true)}
                        className="px-2.5 py-1 text-xs font-semibold text-meaven-blue hover:text-white bg-meaven-blue/10 hover:bg-meaven-blue rounded border border-meaven-blue/30 transition"
                      >
                        Edit Notes
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setIsEditingNotes(false)}
                          className="px-2.5 py-1 text-xs font-medium text-slate-400 hover:text-slate-200"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveCompanyNotes}
                          className="px-3 py-1 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded"
                        >
                          Save Notes
                        </button>
                      </div>
                    )}
                  </div>

                  {!isEditingNotes ? (
                    <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed min-h-[60px] p-3 bg-cockpit-bg rounded-lg border border-cockpit-border/50">
                      {relationship.relationshipNotes || 'No permanent company notes added yet. Click "Edit Notes" to record founder background context.'}
                    </p>
                  ) : (
                    <textarea
                      rows={4}
                      value={companyNotesText}
                      onChange={(e) => setCompanyNotesText(e.target.value)}
                      placeholder="Add permanent account notes, founder observations, background context..."
                      className="w-full bg-slate-950 border border-blue-500/50 rounded-lg p-3 text-xs text-slate-100 focus:outline-none"
                    />
                  )}

                  {relationship.servicesDiscussed && relationship.servicesDiscussed.length > 0 && (
                    <div className="pt-2 flex flex-wrap gap-2">
                      <span className="text-[11px] font-semibold text-cockpit-muted self-center">Services:</span>
                      {relationship.servicesDiscussed.map((srv, idx) => (
                        <span
                          key={idx}
                          className="text-[11px] px-2 py-0.5 bg-cockpit-surface border border-cockpit-border text-slate-300 rounded"
                        >
                          {srv}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: SECTION 3 & 4: IDENTITY & RELATIONSHIP METADATA */}
              <div className="space-y-6">
                <div className="cockpit-card p-5 space-y-4">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider border-b border-cockpit-border pb-2 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-meaven-blue" />
                    Company Identity
                  </h3>

                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between">
                      <span className="text-cockpit-muted">Organization</span>
                      <span className="font-bold text-slate-100">{company.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-cockpit-muted">Sector / Type</span>
                      <span className="font-semibold text-meaven-light">{company.type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-cockpit-muted">Location / City</span>
                      <span className="font-mono text-slate-300">{company.city}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-cockpit-muted">Team Size</span>
                      <span className="font-mono text-slate-300">{company.employeeCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-cockpit-muted">Website</span>
                      <a
                        href={company.website}
                        target="_blank"
                        rel="noreferrer"
                        className="font-mono text-meaven-blue hover:underline"
                      >
                        {company.domain || 'Visit Site'}
                      </a>
                    </div>
                  </div>
                </div>

                <div className="cockpit-card p-5 space-y-4">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider border-b border-cockpit-border pb-2 flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-400" />
                    Relationship State
                  </h3>

                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-cockpit-muted">Lifecycle Status</span>
                      <span className="font-bold px-2 py-0.5 bg-blue-500/20 text-blue-300 border border-blue-500/40 rounded uppercase">
                        {relationship.status}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-cockpit-muted">Temperature</span>
                      <span className="font-bold text-amber-400">{relationship.temperature}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-cockpit-muted">Relationship Owner</span>
                      {currentUser?.role === 'ADMIN' && usersList.length > 0 ? (
                        <select
                          value={relationship.owner}
                          onChange={(e) => handleUpdateOwner(e.target.value)}
                          className="text-xs font-semibold bg-cockpit-bg border border-cockpit-border rounded px-2 py-0.5 text-slate-200 focus:outline-none focus:border-meaven-blue"
                        >
                          {usersList.map((u) => (
                            <option key={u.id} value={u.name}>
                              {u.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="font-semibold text-slate-200">{relationship.owner}</span>
                      )}
                    </div>
                    <div className="flex justify-between">
                      <span className="text-cockpit-muted">Inactivity Counter</span>
                      <span className="font-mono text-amber-400 font-semibold">{relationship.daysInactive} days</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-cockpit-muted">First Contact Date</span>
                      <span className="font-mono text-slate-300">{relationship.firstContactDate}</span>
                    </div>
                    {relationship.partnerSince && (
                      <div className="flex justify-between">
                        <span className="text-cockpit-muted">Partner Since</span>
                        <span className="font-mono text-emerald-400 font-semibold">{relationship.partnerSince}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CONTACTS */}
          {activeTab === 'contacts' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs text-cockpit-muted">Key decision makers and principal contacts</span>
                <button
                  onClick={() => {
                    setEditingContact(null);
                    setShowAddContactModal(true);
                  }}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Contact</span>
                </button>
              </div>

              {contacts.length === 0 ? (
                <div className="py-12 text-center text-xs text-cockpit-muted cockpit-panel border border-dashed border-cockpit-border">
                  No active contacts listed for this company yet. Click &quot;Add Contact&quot; to register a decision maker.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {contacts.map((contact) => (
                    <div key={contact.id} className="cockpit-card p-4 flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-bold text-slate-100">{contact.name}</h4>
                          {contact.isDecisionMaker && (
                            <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded uppercase flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3 text-amber-400" />
                              Decision Maker
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-meaven-light font-medium">{contact.role}</p>

                        <div className="space-y-1 text-xs text-cockpit-muted font-mono pt-1">
                          {contact.email && (
                            <div className="flex items-center gap-2">
                              <Mail className="w-3.5 h-3.5 text-cockpit-subtle" />
                              <a href={`mailto:${contact.email}`} className="hover:underline text-slate-300">{contact.email}</a>
                            </div>
                          )}
                          {contact.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="w-3.5 h-3.5 text-cockpit-subtle" />
                              <span className="text-slate-300">{contact.phone}</span>
                            </div>
                          )}
                          {contact.linkedin && (
                            <div className="flex items-center gap-2">
                              <Linkedin className="w-3.5 h-3.5 text-blue-400" />
                              <a href={contact.linkedin} target="_blank" rel="noreferrer" className="hover:underline text-blue-400">
                                LinkedIn Profile
                              </a>
                            </div>
                          )}
                        </div>

                        {contact.notes && (
                          <p className="text-xs text-slate-400 pt-1 border-t border-cockpit-border/40 italic">
                            &quot;{contact.notes}&quot;
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => {
                            setEditingContact(contact);
                            setShowAddContactModal(true);
                          }}
                          className="p-1.5 text-cockpit-subtle hover:text-meaven-blue rounded hover:bg-slate-800"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteContact(contact.id)}
                          className="p-1.5 text-cockpit-subtle hover:text-rose-400 rounded hover:bg-slate-800"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: OPPORTUNITIES */}
          {activeTab === 'opportunities' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs text-cockpit-muted">Commercial pre-project opportunities</span>
                <button
                  onClick={() => {
                    setEditingOpportunity(null);
                    setShowAddOppModal(true);
                  }}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Opportunity</span>
                </button>
              </div>

              {opportunities.length === 0 ? (
                <div className="py-12 text-center text-xs text-cockpit-muted cockpit-panel border border-dashed border-cockpit-border">
                  No active commercial opportunities recorded. Click &quot;Add Opportunity&quot; to initiate a pipeline stage.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {opportunities.map((opp) => (
                    <div key={opp.id} className="cockpit-card p-4 flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <h4 className="text-sm font-bold text-slate-100">{opp.title}</h4>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 uppercase">
                            {opp.stage}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs font-mono text-cockpit-muted">
                          <span>Est. Value: <strong className="text-emerald-400">{formatINR(opp.estimatedValueAmount || 0)}</strong></span>
                          <span>•</span>
                          <span>Next Action: <strong className="text-slate-200">{opp.nextAction || 'N/A'}</strong> ({opp.nextActionDate || 'No Date'})</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditingOpportunity(opp);
                            setShowAddOppModal(true);
                          }}
                          className="px-3 py-1.5 bg-cockpit-bg border border-cockpit-border hover:bg-cockpit-hover text-xs font-medium text-slate-300 rounded flex items-center gap-1"
                        >
                          <Edit className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleDeleteOpp(opp.id)}
                          className="px-3 py-1.5 bg-rose-500/10 border border-rose-500/30 hover:bg-rose-500/20 text-xs font-medium text-rose-400 rounded flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Archive</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: ACTIVITY */}
          {activeTab === 'activity' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs text-cockpit-muted">Historical interactions and touchpoint ledger</span>
                <button
                  onClick={() => setShowAddInteractionModal(true)}
                  className="px-3 py-1.5 bg-meaven-blue hover:bg-meaven-hover text-white text-xs font-semibold rounded-lg flex items-center gap-1 shadow-sm"
                >
                  <MessageSquarePlus className="w-3.5 h-3.5" />
                  <span>Log Interaction</span>
                </button>
              </div>

              {interactions.length === 0 ? (
                <div className="py-12 text-center text-xs text-cockpit-muted cockpit-panel border border-dashed border-cockpit-border">
                  No interactions recorded yet. Click &quot;Log Interaction&quot; to register a meeting or call.
                </div>
              ) : (
                <div className="space-y-3">
                  {interactions.map((int) => (
                    <div key={int.id} className="cockpit-card p-4 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 font-bold text-slate-200">
                          <span className="px-2 py-0.5 rounded bg-blue-500/15 text-blue-400 border border-blue-500/30 uppercase">
                            {int.channel}
                          </span>
                          <span>With {int.contactName || 'Principal Contact'}</span>
                        </div>
                        <span className="font-mono text-cockpit-muted">{int.date}</span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed font-medium">{int.summary}</p>
                      {(int.whatTheyNeeded || int.whatWeLearned) && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-cockpit-bg p-2.5 rounded border border-cockpit-border/50">
                          {int.whatTheyNeeded && (
                            <div>
                              <span className="text-cockpit-subtle block font-semibold text-[10px] uppercase">What they needed</span>
                              <span className="text-slate-300">{int.whatTheyNeeded}</span>
                            </div>
                          )}
                          {int.whatWeLearned && (
                            <div>
                              <span className="text-cockpit-subtle block font-semibold text-[10px] uppercase">What we learned</span>
                              <span className="text-slate-300">{int.whatWeLearned}</span>
                            </div>
                          )}
                        </div>
                      )}
                      {int.nextAction && (
                        <div className="text-xs text-meaven-light font-medium pt-1">
                          Next Action: <span className="text-slate-200">{int.nextAction}</span> (Due: {int.nextActionDate || 'N/A'})
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: AI RESEARCH */}
          {activeTab === 'research' && (
            <div className="space-y-4">
              {candidateResearch ? (
                <div className="cockpit-card p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-cockpit-border pb-3">
                    <h3 className="text-sm font-bold text-slate-100">AI Deep Research Dossier</h3>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      Verified Active Research
                    </span>
                  </div>
                  <div className="text-xs text-slate-300 space-y-2">
                    <p><strong>Summary:</strong> {candidateResearch.summary}</p>
                    <p><strong>ICP Fit Score:</strong> {candidateResearch.fitScore}%</p>
                    <p><strong>Partner Opportunity Signal:</strong> {candidateResearch.partnerOpportunitySignal}</p>
                  </div>
                </div>
              ) : research ? (
                <div className="cockpit-card p-5 space-y-3 text-xs text-slate-300">
                  <p><strong>Market Segment:</strong> {research.marketSegment}</p>
                  <p><strong>Strengths:</strong> {research.strengths.join(', ')}</p>
                </div>
              ) : (
                <div className="py-12 text-center text-xs text-cockpit-muted cockpit-panel border border-dashed border-cockpit-border">
                  No AI research record linked to this company account yet.
                </div>
              )}
            </div>
          )}

          {/* TAB 6: INTELLIGENCE */}
          {activeTab === 'intelligence' && (
            <div className="space-y-4">
              {intelligence ? (
                <div className="cockpit-card p-5 space-y-3 text-xs text-slate-300">
                  <p><strong>Health Score:</strong> {intelligence.healthScore}/100</p>
                  <p><strong>Recommendation:</strong> {intelligence.recommendation}</p>
                  <p><strong>Nurture Cadence:</strong> {intelligence.nurtureCadence}</p>
                </div>
              ) : (
                <div className="py-12 text-center text-xs text-cockpit-muted cockpit-panel border border-dashed border-cockpit-border">
                  No strategic intelligence notes recorded yet.
                </div>
              )}
            </div>
          )}

          {/* TAB 7: PROJECT LINKS */}
          {activeTab === 'projectLinks' && (
            <div className="space-y-4">
              {projectLinks.length === 0 ? (
                <div className="py-12 text-center text-xs text-cockpit-muted cockpit-panel border border-dashed border-cockpit-border">
                  No Meaven Hub project links associated with this account.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {projectLinks.map((p) => (
                    <div key={p.id} className="cockpit-card p-4 flex justify-between items-center text-xs">
                      <div>
                        <div className="font-bold text-slate-100">{p.projectName}</div>
                        <div className="text-cockpit-muted font-mono">{p.status} • {p.valueFormatted}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* MODALS */}
      <AddContactModal
        isOpen={showAddContactModal}
        companyId={company.id}
        companyName={company.name}
        initialContact={editingContact}
        onClose={() => {
          setShowAddContactModal(false);
          setEditingContact(null);
        }}
        onSuccess={() => {
          if (onRefresh) onRefresh();
        }}
      />

      <AddOpportunityModal
        isOpen={showAddOppModal}
        companyId={company.id}
        companyName={company.name}
        initialOpportunity={editingOpportunity}
        onClose={() => {
          setShowAddOppModal(false);
          setEditingOpportunity(null);
        }}
        onSuccess={() => {
          if (onRefresh) onRefresh();
        }}
      />

      <InteractionModal
        isOpen={showAddInteractionModal}
        onClose={() => setShowAddInteractionModal(false)}
        defaultCompanyId={company.id}
        onSuccess={() => {
          if (onRefresh) onRefresh();
        }}
      />
    </>
  );
};
