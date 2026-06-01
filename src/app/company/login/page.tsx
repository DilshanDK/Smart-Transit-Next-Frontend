"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/core/lib/api-client";
import { useAuth } from "@/core/context/AuthContext";
import Cookies from "js-cookie";
import {
  Building2,
  Mail,
  Lock,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Eye,
  EyeOff
} from "lucide-react";
import Link from "next/link";

export default function CompanyLoginPage() {
  const router = useRouter();
  const { user, role, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If already logged in as company, redirect straight to dashboard
  useEffect(() => {
    if (!authLoading && user && role === "company") {
      router.push("/company/dashboard");
    }
  }, [user, role, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await apiClient.post("/auth/company/login", {
        email,
        password
      });

      if (res.status === 200 || res.status === 201) {
        const { accessToken, refreshToken } = res.data;
        // Save tokens in cookies (expire in 7 days matching context)
        Cookies.set("transit_token", accessToken, { expires: 7 });
        Cookies.set("transit_refresh_token", refreshToken, { expires: 7 });

        // Redirect to company dashboard
        router.push("/company/dashboard");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Invalid company administrator credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-12 bg-[var(--color-background)]">
      {/* Left Column - Graphic/Branding - 5 cols */}
      <div className="hidden lg:flex lg:col-span-5 relative overflow-hidden bg-gradient-to-br from-neutral-900 to-indigo-950 text-white flex-col justify-between p-12 select-none">
        {/* Animated background lights */}
        <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] bg-[var(--color-primary)]/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none" />

        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-indigo-500 flex items-center justify-center">
            <Building2 className="h-5 w-5 text-white" />
          </div>
          <span className="font-extrabold text-lg tracking-tight">Smart Transit</span>
        </div>

        <div className="space-y-6 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <ShieldCheck className="h-3.5 w-3.5" />
            B2B Enterprise Portal
          </div>
          <h2 className="text-4xl font-extrabold tracking-tight leading-tight">
            Fleet Operations & Revenue Console
          </h2>
          <p className="text-sm text-neutral-400 leading-relaxed max-w-sm">
            Access secure fleet registration, telemetry dashboards, driver dispatch metrics, and Stripe Connect payouts.
          </p>
        </div>

        <div className="text-xs text-neutral-500">
          &copy; 2026 Smart Transit Systems Inc. Enterprise Clearance Required.
        </div>
      </div>

      {/* Right Column - Login Form - 7 cols */}
      <div className="lg:col-span-7 flex flex-col justify-center px-6 py-12 md:px-16 lg:px-24">
        <div className="mx-auto w-full max-w-md space-y-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-[var(--color-on-surface)]">
              Admin Sign In
            </h1>
            <p className="text-sm text-muted mt-2">
              Log in to manage your transit fleet operations and ledger earnings.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted uppercase tracking-wider">
                Corporate Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@buscompany.com"
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
              disabled={loading}
              className="w-full btn-primary py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <span className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Verify Credentials
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Helper Switch for Demo */}
          <div className="p-4 rounded-xl bg-[var(--color-surface-variant)] border border-[var(--color-outline-variant)] text-center text-xs text-muted leading-relaxed">
            Not registered? You can register a mock company account to test the admin portal features.
            <div className="mt-3 font-semibold text-[var(--color-primary)]">
              <Link href="/passenger/login" className="hover:underline">
                Passenger Portal Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
