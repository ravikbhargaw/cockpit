'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Users, Search, Filter, ArrowRight, Plus, Building2 } from 'lucide-react';
import { CompanyAccountView } from '@/components/account/CompanyAccountView';
import { AddCompanyModal } from '@/components/common/AddCompanyModal';
import { Company } from '@/types';

function RelationshipsContent() {
  const searchParams = useSearchParams();
  const initialCompanyId = searchParams ? searchParams.get('companyId') : null;

  const [companies, setCompanies] = useState<any[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(initialCompanyId || null);
  const [selectedAccountData, setSelectedAccountData] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [isLoadingAccount, setIsLoadingAccount] = useState<boolean>(false);
  const [isAddCompanyOpen, setIsAddCompanyOpen] = useState<boolean>(false);

  const fetchCompanies = useCallback(async () => {
    try {
      const res = await fetch(`/api/companies?search=${encodeURIComponent(searchQuery)}&status=${statusFilter}`);
      if (res.ok) {
        const json = await res.json();
        setCompanies(json);
      }
    } catch {
      console.error('Failed to fetch companies');
    }
  }, [searchQuery, statusFilter]);

  const fetchSingleAccount = useCallback(async (id: string) => {
    setIsLoadingAccount(true);
    try {
      const res = await fetch(`/api/companies/${id}`);
      if (res.ok) {
        const json = await res.json();
        setSelectedAccountData(json);
      }
    } catch {
      console.error('Failed to fetch company account view');
    } finally {
      setIsLoadingAccount(false);
    }
  }, []);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  useEffect(() => {
    if (selectedCompanyId) {
      fetchSingleAccount(selectedCompanyId);
    } else {
      setSelectedAccountData(null);
    }
  }, [selectedCompanyId, fetchSingleAccount]);

  return (
    <div className="space-y-6">
      <AddCompanyModal
        isOpen={isAddCompanyOpen}
        onClose={() => setIsAddCompanyOpen(false)}
        onSuccess={(newCompanyId) => {
          fetchCompanies();
          setSelectedCompanyId(newCompanyId);
        }}
      />

      {/* If a company is selected, render live database-backed Partner Account View */}
      {selectedCompanyId && selectedAccountData ? (
        <CompanyAccountView
          company={selectedAccountData.company}
          relationship={selectedAccountData.relationship}
          contacts={selectedAccountData.contacts || []}
          opportunities={selectedAccountData.opportunities || []}
          interactions={selectedAccountData.interactions || []}
          research={selectedAccountData.research}
          intelligence={selectedAccountData.intelligence}
          projectLinks={selectedAccountData.projectLinks || []}
          onRefresh={() => fetchSingleAccount(selectedCompanyId)}
          onClose={() => setSelectedCompanyId(null)}
        />
      ) : (
        <>
          {/* Header Banner */}
          <div className="cockpit-panel p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Users className="w-4 h-4 text-meaven-blue" />
                  <span className="text-xs font-bold uppercase tracking-wider text-meaven-blue">
                    Relationship Hub
                  </span>
                </div>
                <h1 className="text-2xl font-bold text-slate-100">Companies & Partners</h1>
                <p className="text-xs text-cockpit-muted mt-1 max-w-2xl">
                  Unified view of organizations, decision-maker contacts, and relationship progression stages.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-3 bg-cockpit-surface border border-cockpit-border rounded-lg text-xs font-mono text-cockpit-muted">
                  <span>Total Active Accounts: <strong>{companies.length}</strong></span>
                </div>
                <button
                  onClick={() => setIsAddCompanyOpen(true)}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-lg flex items-center gap-2 transition shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Company</span>
                </button>
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-cockpit-surface p-4 rounded-xl border border-cockpit-border">
            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
              <Filter className="w-4 h-4 text-cockpit-subtle shrink-0" />
              <span className="text-xs font-semibold text-slate-300 shrink-0">Status:</span>
              <div className="flex items-center space-x-1 shrink-0">
                {['All', 'Prospect', 'Opportunity', 'Meeting', 'Active Partner', 'Strategic Partner'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                      statusFilter === st
                        ? 'bg-meaven-blue text-white'
                        : 'text-cockpit-muted hover:text-slate-200 bg-cockpit-card border border-cockpit-border'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            <div className="w-full sm:w-64 relative">
              <Search className="w-3.5 h-3.5 text-cockpit-subtle absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search company or city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-cockpit-bg border border-cockpit-border rounded text-xs text-slate-200 focus:outline-none focus:border-meaven-blue"
              />
            </div>
          </div>

          {/* Company Directory List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {companies.map((company) => {
              const rel = company.relationship;
              return (
                <div
                  key={company.id}
                  onClick={() => setSelectedCompanyId(company.id)}
                  className="cockpit-card p-5 cursor-pointer hover:border-meaven-blue/50 transition-all flex items-start justify-between group"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-meaven-blue/20 border border-meaven-blue/40 flex items-center justify-center text-meaven-blue font-bold text-sm shrink-0">
                      {company.logoInitials}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-base font-bold text-slate-100 group-hover:text-meaven-light transition-colors">
                          {company.name}
                        </h3>
                        {rel && (
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                              rel.status === 'Active Partner' || rel.status === 'Strategic Partner'
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                            }`}
                          >
                            {rel.status}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-cockpit-muted font-mono mb-2">
                        {company.type} • {company.city}
                      </p>

                      {rel && (
                        <div className="text-xs text-cockpit-subtle space-y-1">
                          <div className="line-clamp-1">
                            Next: <span className="text-slate-300">{rel.nextAction || 'No next action set'}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center text-xs font-semibold text-meaven-blue group-hover:translate-x-1 transition-transform shrink-0">
                    <span>Open Account</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export default function RelationshipsPage() {
  return (
    <Suspense fallback={<div className="p-6 text-xs text-cockpit-muted">Loading relationships...</div>}>
      <RelationshipsContent />
    </Suspense>
  );
}
