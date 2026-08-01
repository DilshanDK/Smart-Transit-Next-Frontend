'use client';

import React, { useState } from 'react';
import { apiClient } from '@/core/lib/api-client';
import Cookies from 'js-cookie';
import { Building2, ShieldCheck, Mail, KeyRound, User, AlertTriangle, ArrowLeft, Loader2, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import ThemeToggle from '@/app/components/theme-toggle';

export default function PassengerRegister() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const response = await apiClient.post('/auth/passenger/register', {
        email,
        fullName,
        password,
      });

      if (response.status === 200 || response.status === 201) {
        const { accessToken, refreshToken } = response.data;
        
        // Save tokens in cookies
        Cookies.set('transit_token', accessToken, { expires: 7, secure: true, sameSite: 'strict' });
        Cookies.set('transit_refresh_token', refreshToken, { expires: 7, secure: true, sameSite: 'strict' });
        
        // Redirect directly to dashboard and reload to boot context state
        window.location.href = '/passenger/dashboard';
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Registration failed. Try again.';
      setError(msg);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-12 bg-[var(--color-bg-gradient)] bg-[length:400%_400%] animate-gradient-shift relative">
      {/* Left Column - Graphic/Branding - 5 cols */}
      <div className="hidden lg:flex lg:col-span-5 relative overflow-hidden bg-[#0a0d14] text-white flex-col justify-between p-12 select-none">
        {/* Animated background lights */}
        <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] bg-[var(--color-primary)]/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none" />

        <Link href="/" className="flex items-center gap-3 relative z-10 text-white">
          <div className="h-9 w-9 rounded-xl bg-indigo-500 flex items-center justify-center">
            <Building2 className="h-5 w-5 text-white" />
          </div>
          <span className="font-extrabold text-lg tracking-tight text-white">Smart Transit</span>
        </Link>

        <div className="space-y-6 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <ShieldCheck className="h-3.5 w-3.5" />
            Unified Transit Gateway
          </div>
          <h2 className="text-4xl font-extrabold tracking-tight leading-tight text-white">
            Join the Smart Transit Network.
          </h2>
          <p className="text-sm text-neutral-400 leading-relaxed max-w-sm">
            Access secure company fleet operations dashboards or manage contactless commuter passenger wallets.
          </p>
        </div>

        <div className="text-xs text-neutral-500">
          &copy; 2026 Smart Transit Systems Inc. All rights reserved.
        </div>
      </div>

      {/* Right Column - Registration Form - 7 cols */}
      <div className="lg:col-span-7 flex flex-col justify-center px-6 py-12 md:px-16 lg:px-24 relative bg-transparent">
        <div className="absolute top-6 right-6 z-20">
          <ThemeToggle />
        </div>
        <div className="mx-auto w-full max-w-md space-y-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-[var(--color-on-surface)]">
              Create Passenger Account
            </h1>
            <p className="text-sm text-muted mt-2">
              Sign up to board buses and top-up your wallet online.
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-red-500 flex gap-3 text-xs">
              <AlertTriangle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
              <span className="text-xs font-medium">{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full Name input */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted uppercase tracking-wider">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-[var(--color-outline-variant)] bg-[var(--color-surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-[var(--color-on-surface)]"
                />
              </div>
            </div>

            {/* Email input */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@domain.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-[var(--color-outline-variant)] bg-[var(--color-surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-[var(--color-on-surface)]"
                />
              </div>
            </div>

            {/* Password input */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  className="w-full pl-10 pr-12 py-3 rounded-xl border border-[var(--color-outline-variant)] bg-[var(--color-surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-[var(--color-on-surface)]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted hover:text-[var(--color-on-surface)]"
                >
                  {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                </button>
              </div>
            </div>

            {/* Confirm Password input */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted uppercase tracking-wider">
                Confirm Password
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full pl-10 pr-12 py-3 rounded-xl border border-[var(--color-outline-variant)] bg-[var(--color-surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-[var(--color-on-surface)]"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted hover:text-[var(--color-on-surface)]"
                >
                  {showConfirmPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3.5 px-4 rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:pointer-events-none text-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          {/* Footer info */}
          <div className="pt-5 border-t border-[var(--color-outline-variant)] text-center space-y-4">
            <p className="text-xs text-muted">
              Already have an account?{' '}
              <Link href="/login" className="text-[var(--color-primary)] font-semibold hover:underline">
                Log In
              </Link>
            </p>
            
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-[var(--color-on-surface)] transition-colors"
            >
              <ArrowLeft className="h-3 w-3" />
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
