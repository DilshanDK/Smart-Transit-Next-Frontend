'use client';

import React, { useState } from 'react';
import { useAuth } from '@/core/context/AuthContext';
import { Bus, KeyRound, Mail, AlertTriangle, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function PassengerLogin() {
  const { loginPassenger } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await loginPassenger(email, password);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Invalid email or password';
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
      <div className="card w-full max-w-md p-8 md:p-10 backdrop-blur-md bg-opacity-95 shadow-xl relative z-10 transition-all duration-300 hover:shadow-2xl">
        
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="h-14 w-14 rounded-2xl bg-[var(--color-primary)] bg-opacity-10 flex items-center justify-center mb-4 border border-[var(--color-primary)] border-opacity-20">
            <Bus className="h-7 w-7 text-[var(--color-primary)] animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-center">Passenger Portal</h2>
          <p className="text-sm text-muted text-center mt-1">
            Access your Smart Transit wallet & journey records
          </p>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-6 p-4 surface-variant border border-red-500/20 bg-red-500/5 rounded-xl flex items-start gap-3 animate-[shake_0.5s_ease-in-out]">
            <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
            <span className="text-sm text-red-500 font-medium">{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email input */}
          <div className="space-y-2">
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
                className="w-full pl-10 pr-4 py-3 bg-[var(--color-surface-variant)] border border-[var(--color-outline-variant)] rounded-xl text-sm focus:outline-none focus:border-[var(--color-primary)] transition-all"
              />
            </div>
          </div>

          {/* Password input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted block">
                Password
              </label>
              {/* Reset link could go here */}
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted">
                <KeyRound className="h-4 w-4" />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 bg-[var(--color-surface-variant)] border border-[var(--color-outline-variant)] rounded-xl text-sm focus:outline-none focus:border-[var(--color-primary)] transition-all"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-3.5 mt-2 rounded-xl flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed text-sm"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Signing In...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Footer info */}
        <div className="mt-8 pt-6 border-t border-[var(--color-outline-variant)] text-center space-y-4">
          <p className="text-xs text-muted">
            Don't have an account yet?{' '}
            <Link href="/passenger/register" className="text-[var(--color-primary)] font-semibold hover:underline">
              Create Account
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
