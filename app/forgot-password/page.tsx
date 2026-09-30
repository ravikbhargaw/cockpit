'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { KeyRound, ArrowLeft, Mail, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
    } catch {
      // Ignore network errors to preserve uniform generic user response
    } finally {
      setIsSubmitting(false);
      setSubmitted(true);
    }
  };

  return (
    <div className="min-h-screen bg-cockpit-bg flex flex-col items-center justify-center p-4 relative overflow-hidden text-cockpit-text">
      {/* Subtle background glow */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-meaven-blue/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-cockpit-surface border border-cockpit-border rounded-2xl shadow-2xl p-8 relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-meaven-blue/20 border border-meaven-blue/40 flex items-center justify-center text-meaven-blue mx-auto mb-3 shadow-glow-meaven">
            <KeyRound className="w-6 h-6" />
          </div>

          <h1 className="text-xl font-bold tracking-tight text-slate-100">
            Forgot Password
          </h1>

          <p className="text-xs text-cockpit-muted leading-relaxed">
            Enter your email address and we'll help you reset your password.
          </p>
        </div>

        {/* Response Feedback */}
        {submitted ? (
          <div className="space-y-4">
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 space-y-2">
              <div className="flex items-center gap-2 font-semibold text-emerald-400">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Reset Link Requested</span>
              </div>
              <p className="text-emerald-200/80 leading-relaxed">
                If an account exists for that email, a password reset link has been prepared.
              </p>
            </div>

            <Link
              href="/login"
              className="w-full py-3 bg-cockpit-card hover:bg-cockpit-hover border border-cockpit-border text-slate-200 text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Login</span>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5 font-mono uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-cockpit-subtle">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  autoFocus
                  placeholder="name@meaven.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-cockpit-bg border border-cockpit-border focus:border-meaven-blue rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-meaven-blue hover:bg-meaven-hover text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-meaven-blue/20 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <span>Generating Reset Link...</span>
              ) : (
                <span>Send Reset Link</span>
              )}
            </button>

            <div className="pt-2 text-center">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-xs text-cockpit-muted hover:text-slate-200 transition-colors font-medium"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Login</span>
              </Link>
            </div>
          </form>
        )}

        {/* Executive Footnote */}
        <div className="pt-4 border-t border-cockpit-border/60 flex items-center justify-between text-[10px] text-cockpit-subtle font-mono">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-400" /> Account-Protected Flow
          </span>
          <span className="flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-meaven-blue" /> Local Security
          </span>
        </div>
      </div>
    </div>
  );
}
