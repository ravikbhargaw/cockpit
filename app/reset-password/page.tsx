'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Lock, CheckCircle2, AlertCircle, ArrowRight, ShieldCheck, Sparkles, RefreshCw } from 'lucide-react';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams?.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError('This password reset link is invalid or has expired.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify both entries.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password, confirmPassword }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setIsSuccess(true);
      } else {
        setError(data.error || 'This password reset link is invalid or has expired.');
      }
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!token) {
    return (
      <div className="w-full max-w-md bg-cockpit-surface border border-cockpit-border rounded-2xl shadow-2xl p-8 space-y-6 relative z-10 text-cockpit-text">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 mx-auto mb-3">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-slate-100">Invalid Reset Link</h1>
          <p className="text-xs text-cockpit-muted">
            This password reset link is invalid or has expired.
          </p>
        </div>

        <Link
          href="/forgot-password"
          className="w-full py-3 bg-meaven-blue hover:bg-meaven-hover text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-meaven-blue/20"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Request a new reset link</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md bg-cockpit-surface border border-cockpit-border rounded-2xl shadow-2xl p-8 space-y-6 relative z-10 text-cockpit-text">
      {/* Brand Header */}
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-xl bg-meaven-blue/20 border border-meaven-blue/40 flex items-center justify-center text-meaven-blue mx-auto mb-3 shadow-glow-meaven">
          <Lock className="w-6 h-6" />
        </div>

        <h1 className="text-xl font-bold tracking-tight text-slate-100">
          Reset Password
        </h1>

        <p className="text-xs text-cockpit-muted">
          Create a new password for your Founder Cockpit account.
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400 space-y-2">
          <div className="flex items-center gap-2 font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          {error.includes('invalid or has expired') && (
            <div className="pt-1">
              <Link
                href="/forgot-password"
                className="text-[11px] text-meaven-light underline hover:text-slate-100 font-medium"
              >
                Request a new reset link
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Success State */}
      {isSuccess ? (
        <div className="space-y-4">
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-emerald-400">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Password Reset Successful</span>
            </div>
            <p className="text-emerald-200/80 leading-relaxed">
              Your password has been reset. Please log in with your new password.
            </p>
          </div>

          <Link
            href="/login"
            className="w-full py-3 bg-meaven-blue hover:bg-meaven-hover text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-meaven-blue/20"
          >
            <span>Proceed to Login</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* New Password */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5 font-mono uppercase tracking-wider">
              New Password
            </label>
            <input
              type="password"
              required
              autoFocus
              placeholder="Enter new password..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-cockpit-bg border border-cockpit-border focus:border-meaven-blue rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition-colors"
            />
          </div>

          {/* Confirm New Password */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5 font-mono uppercase tracking-wider">
              Confirm New Password
            </label>
            <input
              type="password"
              required
              placeholder="Confirm new password..."
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 bg-cockpit-bg border border-cockpit-border focus:border-meaven-blue rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition-colors"
            />
          </div>

          {/* Password Policy Guidelines */}
          <div className="p-3 bg-cockpit-bg border border-cockpit-border rounded-xl text-[11px] text-cockpit-subtle space-y-1 font-mono">
            <span className="font-semibold text-cockpit-muted block mb-0.5">Password requirements:</span>
            <div className="flex items-center gap-1.5">
              <span className={password.length >= 8 ? 'text-emerald-400 font-bold' : ''}>• At least 8 characters</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={/[A-Z]/.test(password) && /[a-z]/.test(password) ? 'text-emerald-400 font-bold' : ''}>• Mixed case (uppercase & lowercase)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={/[0-9]/.test(password) ? 'text-emerald-400 font-bold' : ''}>• At least one number</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-meaven-blue hover:bg-meaven-hover text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-meaven-blue/20 disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? (
              <span>Resetting Password...</span>
            ) : (
              <>
                <span>Reset Password</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      )}

      {/* Executive Footnote */}
      <div className="pt-4 border-t border-cockpit-border/60 flex items-center justify-between text-[10px] text-cockpit-subtle font-mono">
        <span className="flex items-center gap-1">
          <ShieldCheck className="w-3 h-3 text-emerald-400" /> PBKDF2 Encrypted
        </span>
        <span className="flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-meaven-blue" /> Session Safety
        </span>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-cockpit-bg flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-meaven-blue/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <Suspense fallback={<div className="text-slate-400 text-xs">Loading reset page...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
