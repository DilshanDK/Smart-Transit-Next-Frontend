"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/core/context/AuthContext";
import {
  Building2,
  Mail,
  Lock,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Eye,
  EyeOff,
  ArrowLeft,
  Loader2,
  User,
} from "lucide-react";
import Link from "next/link";
import ThemeToggle from "./theme-toggle";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth as firebaseAuth } from "@/core/lib/firebase";

export default function UnifiedLoginView() {
  const router = useRouter();
  const { user, role: authRole, loading: authLoading, login, unifiedGoogleLogin } = useAuth();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if already logged in matching their role
  useEffect(() => {
    if (!authLoading && user) {
      if (authRole === "company") {
        router.push("/company/dashboard");
      } else if (authRole === "passenger") {
        router.push("/passenger/dashboard");
      }
    }
  }, [user, authRole, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const authenticatedRole = await login(email, password);
      if (authenticatedRole === "company") {
        router.push("/company/dashboard");
      } else if (authenticatedRole === "passenger") {
        router.push("/passenger/dashboard");
      } else {
        setError("Sign in succeeded, but web access is not permitted for drivers.");
        setLoading(false);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || "Invalid credentials. Please verify details.";
      setError(msg);
      setLoading(false);
    }
  };

  const handleQuickLogin = async (demoEmail: string) => {
    setLoading(true);
    setError(null);

    try {
      const authenticatedRole = await login(demoEmail, "password123");
      if (authenticatedRole === "company") {
        router.push("/company/dashboard");
      } else {
        router.push("/passenger/dashboard");
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || "Demo sign-in failed. Please verify seeded database.";
      setError(msg);
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(firebaseAuth, provider);
      const idToken = await result.user.getIdToken();
      
      const authenticatedRole = await unifiedGoogleLogin(idToken);
      if (authenticatedRole === "company") {
        router.push("/company/dashboard");
      } else if (authenticatedRole === "passenger") {
        router.push("/passenger/dashboard");
      } else if (authenticatedRole === "driver") {
        setError("Drivers should log in via the mobile app.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Google sign-in failed.");
    } finally {
      setGoogleLoading(false);
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
            One Portal. Smart Commutes.
          </h2>
          <p className="text-sm text-neutral-400 leading-relaxed max-w-sm">
            Access secure company fleet operations dashboards or manage contactless commuter passenger wallets.
          </p>
        </div>

        <div className="text-xs text-neutral-500">
          &copy; 2026 Smart Transit Systems Inc. All rights reserved.
        </div>
      </div>

      {/* Right Column - Login Form - 7 cols */}
      <div className="lg:col-span-7 flex flex-col justify-center px-6 py-12 md:px-16 lg:px-24 relative bg-transparent">
        <div className="absolute top-6 right-6 z-20">
          <ThemeToggle />
        </div>
        <div className="mx-auto w-full max-w-md space-y-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-[var(--color-on-surface)]">
              Sign In
            </h1>
            <p className="text-sm text-muted mt-2">
              Log in to access your commuter account or company operations.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
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

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-muted uppercase tracking-wider">
                  Password
                </label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
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

            {error && (
              <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-red-500 flex gap-3 text-xs">
                <AlertCircle className="h-4.5 w-4.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full btn-primary py-3.5 px-4 rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:pointer-events-none text-sm"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  Verify Credentials
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
            
            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-[var(--color-outline-variant)]"></div>
              <span className="flex-shrink-0 mx-4 text-xs font-semibold text-muted uppercase">Or continue with</span>
              <div className="flex-grow border-t border-[var(--color-outline-variant)]"></div>
            </div>

            <div className="w-full">
              <button
                type="button"
                onClick={() => handleGoogleSignIn()}
                disabled={loading || googleLoading}
                className="w-full py-2.5 bg-white hover:bg-neutral-50 text-neutral-800 border border-neutral-200 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
              >
                {googleLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-neutral-500" />
                ) : (
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    <path d="M1 1h22v22H1z" fill="none"/>
                  </svg>
                )}
                {googleLoading ? "Signing in..." : "Sign in with Google"}
              </button>
            </div>
          </form>

          <div className="pt-4 border-t border-[var(--color-outline-variant)] text-center space-y-4">
            <p className="text-xs text-muted">
              Don't have a commuter account yet?{" "}
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
    </div>
  );
}
