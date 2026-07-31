'use client';

import React, { useState } from 'react';
import { apiClient } from '@/core/lib/api-client';
import Cookies from 'js-cookie';
import { Bus, KeyRound, Mail, User, AlertTriangle, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function PassengerRegister() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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
    <div className="app-shell min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-radial from-[var(--color-surface-variant)] to-[var(--color-bg)]">
      {/* Abstract Background Elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[var(--color-primary)] opacity-5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[var(--color-primary)] opacity-5 blur-[120px] pointer-events-none" />

      {/* Main Glassmorphic Wrapper */}
      <div className="card w-full max-w-md p-8 backdrop-blur-md bg-opacity-95 shadow-xl relative z-10 transition-all duration-300 hover:shadow-2xl">
        
        {/* Header */}
        <div className="flex flex-col items-center mb-6">
          <div className="h-12 w-12 rounded-2xl bg-[var(--color-primary)] bg-opacity-10 flex items-center justify-center mb-3 border border-[var(--color-primary)] border-opacity-20">
            <Bus className="h-6 w-6 text-[var(--color-primary)]" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-center">Create Passenger Account</h2>
          <p className="text-sm text-muted text-center mt-1">
            Sign up to board buses and top-up your wallet online
          </p>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-5 p-4 surface-variant border border-red-500/20 bg-red-500/5 rounded-xl flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
            <span className="text-sm text-red-500 font-medium">{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted block">
              Full Name
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted">
                <User className="h-4 w-4" />
              </span>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe"
                className="w-full pl-10 pr-4 py-2.5 bg-[var(--color-surface-variant)] border border-[var(--color-outline-variant)] rounded-xl text-sm focus:outline-none focus:border-[var(--color-primary)] transition-all"
              />
            </div>
          </div>

          {/* Email input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted block">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted">
                <Mail className="h-4 w-4" />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@domain.com"
                className="w-full pl-10 pr-4 py-2.5 bg-[var(--color-surface-variant)] border border-[var(--color-outline-variant)] rounded-xl text-sm focus:outline-none focus:border-[var(--color-primary)] transition-all"
              />
            </div>
          </div>

          {/* Password input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted block">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted">
                <KeyRound className="h-4 w-4" />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 6 characters"
                className="w-full pl-10 pr-4 py-2.5 bg-[var(--color-surface-variant)] border border-[var(--color-outline-variant)] rounded-xl text-sm focus:outline-none focus:border-[var(--color-primary)] transition-all"
              />
            </div>
          </div>

          {/* Confirm Password input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted block">
              Confirm Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted">
                <KeyRound className="h-4 w-4" />
              </span>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                className="w-full pl-10 pr-4 py-2.5 bg-[var(--color-surface-variant)] border border-[var(--color-outline-variant)] rounded-xl text-sm focus:outline-none focus:border-[var(--color-primary)] transition-all"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-3 mt-2 rounded-xl flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed text-sm"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating Account...
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        {/* Footer info */}
        <div className="mt-6 pt-5 border-t border-[var(--color-outline-variant)] text-center space-y-4">
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
  );
}
