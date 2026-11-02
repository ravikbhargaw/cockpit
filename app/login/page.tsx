'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Lock,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  ShieldCheck,
  Sparkles,
  LayoutDashboard,
  Target,
  Compass,
  Users,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
} from 'lucide-react';

/**
 * Synthetic Dashboard Mockup rendered strictly in the background.
 * Uses realistic, static architectural & design-build placeholders.
 * ZERO authenticated CRM or sensitive production data is fetched or rendered.
 */
function DashboardBackgroundPreview() {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 overflow-hidden pointer-events-none select-none opacity-25 filter blur-[10px] scale-[0.99] transition-opacity duration-1000"
    >
      {/* Mock Header Shell */}
      <div className="w-full bg-cockpit-bg/90 border-b border-cockpit-border px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-meaven-blue" />
          <div className="flex flex-col text-left">
            <span className="text-sm font-bold tracking-widest text-slate-100 uppercase font-mono">
              FOUNDER COCKPIT
            </span>
            <span className="text-[10px] tracking-wider text-meaven-blue uppercase font-medium">
              Meaven Growth & Relationships
            </span>
          </div>
        </div>
        <div className="flex-1 max-w-md mx-8 h-8 rounded-lg bg-cockpit-surface border border-cockpit-border" />
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-meaven-blue/30" />
        </div>
      </div>

      {/* Mock Navigation Shell */}
      <div className="w-full bg-cockpit-bg border-b border-cockpit-border px-8 py-2 flex items-center gap-4 text-xs font-mono text-cockpit-subtle">
        <span className="text-meaven-blue flex items-center gap-1.5"><LayoutDashboard className="w-3.5 h-3.5" /> Today</span>
        <span className="flex items-center gap-1.5"><Compass className="w-3.5 h-3.5" /> Discover</span>
        <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> Relationships</span>
        <span className="flex items-center gap-1.5"><Target className="w-3.5 h-3.5" /> Opportunities</span>
      </div>

      {/* Mock Dashboard Workspace Content */}
      <div className="p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* Mock Daily Briefing Banner */}
        <div className="p-6 bg-gradient-to-r from-cockpit-surface to-meaven-blue/10 border border-cockpit-border rounded-xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-mono text-meaven-blue uppercase tracking-wider">Founder Daily Briefing</span>
            <h2 className="text-2xl font-bold text-slate-100">Good morning, Ravi.</h2>
            <p className="text-xs text-slate-400">3 priority partner actions scheduled for execution today.</p>
          </div>
          <div className="h-8 w-32 bg-cockpit-bg/60 border border-cockpit-border rounded-lg" />
        </div>

        {/* Mock Top Grid: Momentum & Priorities */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 p-5 bg-cockpit-surface border border-cockpit-border rounded-xl space-y-3">
            <span className="text-xs font-mono text-cockpit-muted uppercase">Partner Momentum</span>
            <div className="text-2xl font-bold text-slate-100 font-mono">2 / 5 Active Partners</div>
            <div className="flex gap-2">
              <div className="w-6 h-6 rounded-full bg-meaven-blue" />
              <div className="w-6 h-6 rounded-full bg-meaven-blue" />
              <div className="w-6 h-6 rounded-full bg-cockpit-card border border-cockpit-border" />
              <div className="w-6 h-6 rounded-full bg-cockpit-card border border-cockpit-border" />
              <div className="w-6 h-6 rounded-full bg-cockpit-card border border-cockpit-border" />
            </div>
            <p className="text-xs text-slate-400">3 more to reach your next strategic partner milestone.</p>
          </div>

          <div className="lg:col-span-2 p-5 bg-cockpit-surface border border-cockpit-border rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-amber-400 uppercase">Today&apos;s Founder Priorities</span>
              <span className="text-[10px] font-mono px-2 py-0.5 bg-cockpit-card rounded text-slate-400">3 Actions</span>
            </div>
            <div className="space-y-2">
              <div className="p-3 bg-cockpit-card border border-cockpit-border rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Building2 className="w-4 h-4 text-meaven-blue" />
                  <div>
                    <div className="text-xs font-bold text-slate-200">Kembhavi Architecture Foundation</div>
                    <div className="text-[11px] text-slate-400">Commercial glass specifications review follow-up</div>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-amber-400 px-2 py-0.5 bg-amber-500/10 rounded">Due Today</span>
              </div>
              <div className="p-3 bg-cockpit-card border border-cockpit-border rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Building2 className="w-4 h-4 text-meaven-blue" />
                  <div>
                    <div className="text-xs font-bold text-slate-200">Westwall Turnkey Design-Build</div>
                    <div className="text-[11px] text-slate-400">Executive site coordination &amp; glazing subcontracting</div>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-amber-400 px-2 py-0.5 bg-amber-500/10 rounded">Due Today</span>
              </div>
            </div>
          </div>
        </div>

        {/* Mock Pipeline Snapshot */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-cockpit-surface border border-cockpit-border rounded-xl">
            <span className="text-[10px] font-mono text-slate-400 block mb-1">Active Pipeline</span>
            <span className="text-lg font-bold text-emerald-400 font-mono">₹1,85,00,000</span>
          </div>
          <div className="p-4 bg-cockpit-surface border border-cockpit-border rounded-xl">
            <span className="text-[10px] font-mono text-slate-400 block mb-1">Open Opportunities</span>
            <span className="text-lg font-bold text-slate-100 font-mono">8 Commercial</span>
          </div>
          <div className="p-4 bg-cockpit-surface border border-cockpit-border rounded-xl">
            <span className="text-[10px] font-mono text-slate-400 block mb-1">Follow-ups Due</span>
            <span className="text-lg font-bold text-amber-400 font-mono">3 Scheduled</span>
          </div>
          <div className="p-4 bg-cockpit-surface border border-cockpit-border rounded-xl">
            <span className="text-[10px] font-mono text-slate-400 block mb-1">Research Candidates</span>
            <span className="text-lg font-bold text-meaven-blue font-mono">10 Shortlisted</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams?.get('from') || '/';

  const [email, setEmail] = useState('ravi.bhargaw@meaven.in');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        router.push(from);
        router.refresh();
      } else {
        setError(data.error || 'Invalid credentials. Access denied.');
      }
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-cockpit-surface/95 backdrop-blur-xl border border-cockpit-border/90 rounded-2xl shadow-2xl p-7 sm:p-8 relative z-20 space-y-6">
      {/* Brand Header */}
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-xl bg-meaven-blue/20 border border-meaven-blue/40 flex items-center justify-center text-meaven-blue mx-auto mb-3 shadow-glow-meaven">
          <Lock className="w-6 h-6" />
        </div>

        <div className="flex items-center justify-center gap-2">
          <div className="w-2 h-2 rounded-full bg-meaven-blue shadow-glow-meaven animate-pulse" />
          <h1 className="text-lg sm:text-xl font-bold tracking-widest text-slate-100 uppercase font-mono">
            FOUNDER COCKPIT
          </h1>
        </div>

        <p className="text-xs text-cockpit-muted tracking-wider uppercase font-medium">
          Private Founder Workspace • Executive Access
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400 flex items-center gap-2.5 animate-in fade-in duration-200">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Login Form */}
      <form onSubmit={handleLogin} className="space-y-4">
        {/* Email Field */}
        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-1.5 font-mono uppercase tracking-wider">
            Account Email
          </label>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ravi.bhargaw@meaven.in"
            className="w-full px-4 py-2.5 bg-cockpit-bg border border-cockpit-border focus:border-meaven-blue rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition-colors"
          />
        </div>

        {/* Password Field with Show/Hide Toggle */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-slate-300 font-mono uppercase tracking-wider">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs text-cockpit-muted hover:text-meaven-light transition-colors font-medium"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              required
              autoFocus
              placeholder="Enter password to access..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-4 pr-11 py-2.5 bg-cockpit-bg border border-cockpit-border focus:border-meaven-blue rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-cockpit-subtle hover:text-slate-200 transition-colors cursor-pointer"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 bg-meaven-blue hover:bg-meaven-hover text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-meaven-blue/20 disabled:opacity-50 cursor-pointer"
        >
          {isSubmitting ? (
            <span>Verifying Credentials...</span>
          ) : (
            <>
              <span>Enter Cockpit</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Executive Security Footnote */}
      <div className="pt-4 border-t border-cockpit-border/60 flex items-center justify-between text-[10px] text-cockpit-subtle font-mono">
        <span className="flex items-center gap-1">
          <ShieldCheck className="w-3 h-3 text-emerald-400" /> Server-Enforced Security
        </span>
        <span className="flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-meaven-blue" /> Dedicated Session
        </span>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-cockpit-bg flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Dark Ambient Radial Gradients */}
      <div className="absolute -top-40 -left-40 w-[30rem] h-[30rem] bg-meaven-blue/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-[30rem] h-[30rem] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Realistic Blurred Background Preview (No live CRM data exposed) */}
      <DashboardBackgroundPreview />

      {/* Dark Overlay to increase contrast for the sharp login panel */}
      <div className="absolute inset-0 bg-cockpit-bg/60 backdrop-blur-sm pointer-events-none" />

      {/* Centered Login Card */}
      <Suspense fallback={<div className="text-slate-400 text-xs z-20">Loading login panel...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
