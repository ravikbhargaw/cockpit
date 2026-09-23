'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ShieldCheck, Lock, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams?.get('from') || '/';

  const [password, setPassword] = useState('');
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
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        router.push(from);
        router.refresh();
      } else {
        setError(data.error || 'Invalid password. Access denied.');
      }
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-cockpit-surface border border-cockpit-border rounded-2xl shadow-2xl p-8 relative z-10 space-y-6">
      {/* Brand Header */}
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-xl bg-meaven-blue/20 border border-meaven-blue/40 flex items-center justify-center text-meaven-blue mx-auto mb-3 shadow-glow-meaven">
          <Lock className="w-6 h-6" />
        </div>

        <div className="flex items-center justify-center gap-2">
          <div className="w-2 h-2 rounded-full bg-meaven-blue shadow-glow-meaven" />
          <h1 className="text-xl font-bold tracking-widest text-slate-100 uppercase font-mono">
            FOUNDER COCKPIT
          </h1>
        </div>

        <p className="text-xs text-cockpit-muted tracking-wider uppercase font-medium">
          Private Founder Workspace
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-xs text-rose-400 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Login Form */}
      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-1.5 font-mono uppercase tracking-wider">
            Password
          </label>
          <div className="relative">
            <input
              type="password"
              required
              autoFocus
              placeholder="Enter password to access..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-cockpit-bg border border-cockpit-border focus:border-meaven-blue rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition-colors"
            />
          </div>
        </div>

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

      {/* Executive Footnote */}
      <div className="pt-4 border-t border-cockpit-border/60 flex items-center justify-between text-[10px] text-cockpit-subtle font-mono">
        <span className="flex items-center gap-1">
          <ShieldCheck className="w-3 h-3 text-emerald-400" /> Server-Enforced Security
        </span>
        <span className="flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-meaven-blue" /> Local Engine
        </span>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-cockpit-bg flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Subtle executive background accents */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-meaven-blue/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <Suspense fallback={<div className="text-slate-400 text-xs">Loading login page...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}

