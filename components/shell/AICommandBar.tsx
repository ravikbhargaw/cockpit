'use client';

import React, { useState, useEffect } from 'react';
import { Search, Sparkles, X, ArrowRight, Building2, Users, Target, Activity as ActivityIcon, Database, Command } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface AICommandBarProps {
  isOpen: boolean;
  onClose: () => void;
}

const EXAMPLE_PROMPTS = [
  "Northstar Interiors",
  "Studio Arc",
  "Priya Sharma",
  "Tech Park Phase 2",
  "Workshops",
];

const FUTURE_AI_COMMANDS = [
  "What should I do today?",
  "Which relationships need my attention?",
  "Show me stale relationships",
  "Prepare me for my next meeting",
  "Find companies similar to my best partners",
  "Which opportunities need follow-up?",
  "Give me a relationship summary for this company",
];

export const AICommandBar: React.FC<AICommandBarProps> = ({ isOpen, onClose }) => {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{
    companies: any[];
    contacts: any[];
    opportunities: any[];
    interactions: any[];
  }>({ companies: [], contacts: [], opportunities: [], interactions: [] });

  const [isSearching, setIsSearching] = useState(false);
  const [aiNotice, setAiNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!query.trim()) {
      setSearchResults({ companies: [], contacts: [], opportunities: [], interactions: [] });
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(query)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data && !data.error) {
            setSearchResults(data);
          }
        })
        .catch(() => {})
        .finally(() => setIsSearching(false));
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleNavigate = (path: string) => {
    router.push(path);
    onClose();
  };

  const handleAiSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAiNotice(
      `Local Search executed. Future AI Command Engine is prepared server-side at /api/ai/command (OpenAI key currently disconnected as instructed).`
    );
  };

  const hasLocalResults =
    searchResults.companies.length > 0 ||
    searchResults.contacts.length > 0 ||
    searchResults.opportunities.length > 0 ||
    searchResults.interactions.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-cockpit-surface border border-cockpit-border rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Command Search Input */}
        <form onSubmit={handleAiSubmit} className="flex items-center px-4 py-3.5 border-b border-cockpit-border bg-cockpit-bg/80">
          <Search className="w-5 h-5 text-meaven-blue mr-3 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setAiNotice(null);
            }}
            placeholder="Search companies, contacts, opportunities, or interactions..."
            className="w-full bg-transparent text-slate-100 placeholder-slate-500 focus:outline-none text-base font-medium"
            autoFocus
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setAiNotice(null);
              }}
              className="text-slate-500 hover:text-slate-300 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </form>

        {/* AI Readiness Notice */}
        {aiNotice && (
          <div className="p-3 bg-meaven-blue/10 border-b border-meaven-blue/30 text-xs text-slate-200 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-meaven-blue shrink-0" />
            <span>{aiNotice}</span>
          </div>
        )}

        {/* Real Local Search Results Section */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          {isSearching && (
            <div className="text-center py-6 text-xs text-cockpit-muted">Searching local database...</div>
          )}

          {!isSearching && query && !hasLocalResults && (
            <div className="text-center py-8 text-xs text-cockpit-muted border border-dashed border-cockpit-border rounded-lg">
              No matching local records found for &quot;{query}&quot;.
            </div>
          )}

          {!isSearching && hasLocalResults && (
            <div className="space-y-4">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                <Database className="w-3.5 h-3.5" /> Local Database Matches
              </div>

              {/* Company Results */}
              {searchResults.companies.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold text-cockpit-subtle uppercase">Companies</span>
                  {searchResults.companies.map((comp) => (
                    <button
                      key={comp.id}
                      onClick={() => handleNavigate(`/relationships?companyId=${comp.id}`)}
                      className="w-full text-left p-3 bg-cockpit-card hover:bg-cockpit-hover border border-cockpit-border rounded-lg flex items-center justify-between group transition-all"
                    >
                      <div className="flex items-center gap-2.5">
                        <Building2 className="w-4 h-4 text-meaven-blue" />
                        <div>
                          <span className="text-sm font-bold text-slate-100 group-hover:text-meaven-light">{comp.name}</span>
                          <span className="text-xs text-cockpit-muted ml-2 font-mono">{comp.type} • {comp.city}</span>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-cockpit-subtle group-hover:text-meaven-blue group-hover:translate-x-1 transition-transform" />
                    </button>
                  ))}
                </div>
              )}

              {/* Contact Results */}
              {searchResults.contacts.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold text-cockpit-subtle uppercase">Contacts</span>
                  {searchResults.contacts.map((cnt) => (
                    <button
                      key={cnt.id}
                      onClick={() => handleNavigate(`/relationships?companyId=${cnt.companyId}&tab=contacts`)}
                      className="w-full text-left p-3 bg-cockpit-card hover:bg-cockpit-hover border border-cockpit-border rounded-lg flex items-center justify-between group transition-all"
                    >
                      <div className="flex items-center gap-2.5">
                        <Users className="w-4 h-4 text-sky-400" />
                        <div>
                          <span className="text-sm font-bold text-slate-100 group-hover:text-sky-300">{cnt.name}</span>
                          <span className="text-xs text-cockpit-muted ml-2">{cnt.role} ({cnt.companyName})</span>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-cockpit-subtle group-hover:text-sky-400 group-hover:translate-x-1 transition-transform" />
                    </button>
                  ))}
                </div>
              )}

              {/* Opportunity Results */}
              {searchResults.opportunities.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold text-cockpit-subtle uppercase">Opportunities</span>
                  {searchResults.opportunities.map((opp) => (
                    <button
                      key={opp.id}
                      onClick={() => handleNavigate(`/relationships?companyId=${opp.companyId}&tab=opportunities`)}
                      className="w-full text-left p-3 bg-cockpit-card hover:bg-cockpit-hover border border-cockpit-border rounded-lg flex items-center justify-between group transition-all"
                    >
                      <div className="flex items-center gap-2.5">
                        <Target className="w-4 h-4 text-amber-400" />
                        <div>
                          <span className="text-sm font-bold text-slate-100 group-hover:text-amber-300">{opp.title}</span>
                          <span className="text-xs text-cockpit-muted ml-2 font-mono">{opp.value} • {opp.stage}</span>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-cockpit-subtle group-hover:text-amber-400 group-hover:translate-x-1 transition-transform" />
                    </button>
                  ))}
                </div>
              )}

              {/* Interaction Results */}
              {searchResults.interactions.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold text-cockpit-subtle uppercase">Interactions</span>
                  {searchResults.interactions.map((int) => (
                    <button
                      key={int.id}
                      onClick={() => handleNavigate(`/relationships?companyId=${int.companyId}&tab=activity`)}
                      className="w-full text-left p-3 bg-cockpit-card hover:bg-cockpit-hover border border-cockpit-border rounded-lg flex items-center justify-between group transition-all"
                    >
                      <div className="flex items-center gap-2.5">
                        <ActivityIcon className="w-4 h-4 text-emerald-400" />
                        <div>
                          <span className="text-xs text-slate-200 line-clamp-1">{int.summary}</span>
                          <span className="text-[10px] text-cockpit-muted font-mono">{int.companyName} • {int.channel} • {int.date}</span>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-cockpit-subtle group-hover:text-emerald-400 group-hover:translate-x-1 transition-transform" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {!query && (
            <div className="space-y-4">
              <div>
                <div className="text-[11px] font-bold text-cockpit-subtle uppercase tracking-wider mb-2">
                  Quick Local Entity Search Chips
                </div>
                <div className="flex flex-wrap gap-2">
                  {EXAMPLE_PROMPTS.map((promptText, idx) => (
                    <button
                      key={idx}
                      onClick={() => setQuery(promptText)}
                      className="px-3 py-1.5 text-xs text-slate-300 bg-cockpit-card hover:bg-cockpit-hover border border-cockpit-border rounded-lg transition-all"
                    >
                      {promptText}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-cockpit-border/60">
                <div className="flex items-center gap-2 mb-2.5">
                  <Sparkles className="w-3.5 h-3.5 text-meaven-blue" />
                  <span className="text-xs font-bold text-meaven-blue uppercase tracking-wider">
                    Future AI Commands (Coming Soon in Sprint 3)
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {FUTURE_AI_COMMANDS.map((cmdText, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setAiNotice(`"${cmdText}" is a future AI capability planned for Sprint 3. Real local SQLite database search is currently active.`);
                      }}
                      className="text-left p-2.5 bg-cockpit-card/60 hover:bg-meaven-blue/10 border border-cockpit-border hover:border-meaven-blue/40 rounded-lg text-xs text-slate-300 transition-all flex items-center justify-between group"
                    >
                      <span className="group-hover:text-slate-100">{cmdText}</span>
                      <span className="text-[10px] font-mono text-meaven-blue/80 bg-meaven-blue/10 px-1.5 py-0.5 rounded border border-meaven-blue/20 shrink-0 ml-2">
                        Soon
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2.5 bg-cockpit-bg border-t border-cockpit-border flex items-center justify-between text-[11px] text-cockpit-subtle font-mono">
          <span className="flex items-center gap-1">
            <Command className="w-3 h-3" /> Real SQLite Local Entity Search
          </span>
          <span>Press <kbd className="px-1.5 py-0.5 bg-cockpit-surface border border-cockpit-border rounded text-[10px]">ESC</kbd> to exit</span>
        </div>
      </div>
    </div>
  );
};
