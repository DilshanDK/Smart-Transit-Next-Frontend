"use client";

import React, { useState, useEffect } from "react";
import { apiClient } from "@/core/lib/api-client";
import {
  Building2,
  DollarSign,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowUpRight,
  RefreshCw,
  Loader2,
  ExternalLink,
  Banknote,
  Send,
  Zap,
  TrendingUp
} from "lucide-react";

interface CompanyStats {
  dailyRevenue: number;
  activeDrivers: number;
  activeBuses: number;
  totalJourneys: number;
  pendingLedgerBalance: number;
  isOnboarded: boolean;
}

export default function CompanyStripeConnectPage() {
  const [stats, setStats] = useState<CompanyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [triggeringPayout, setTriggeringPayout] = useState(false);
  const [payoutSuccessMsg, setPayoutSuccessMsg] = useState<string | null>(null);
  const [payoutErrorMsg, setPayoutErrorMsg] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get("/company/stats");
      if (res.status === 200) {
        setStats(res.data);
      }
    } catch (err) {
      console.error("Failed to load company payout metrics", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleTriggerPayout = async () => {
    setTriggeringPayout(true);
    setPayoutSuccessMsg(null);
    setPayoutErrorMsg(null);

    try {
      const res = await apiClient.post("/company/payout/trigger");
      if (res.status === 200 || res.status === 201) {
        setPayoutSuccessMsg(
          res.data?.message || "Nightly payout process triggered successfully! Funds queued for Stripe bank transfer."
        );
        // Refresh balance after payout
        await fetchStats();
      }
    } catch (err: any) {
      console.error("Payout trigger error", err);
      setPayoutErrorMsg(
        err.response?.data?.message || "Failed to trigger payout transfer. Please verify merchant onboarding status."
      );
    } finally {
      setTriggeringPayout(false);
    }
  };

  const pendingBalance = stats?.pendingLedgerBalance || 0;
  const todayRevenue = stats?.dailyRevenue || 0;

  return (
    <div className="space-y-8 animate-fade-in max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[var(--color-on-surface)]">
            Stripe Connect & Payouts
          </h2>
          <p className="text-sm text-muted mt-1">
            Manage merchant bank settlements, evaluate pending fare balances, and dispatch payouts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchStats}
            disabled={loading}
            className="p-2.5 rounded-xl border border-[var(--color-outline-variant)] bg-[var(--color-surface-variant)] text-muted hover:text-[var(--color-on-surface)] transition-all cursor-pointer"
            title="Refresh Balances"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <span className="inline-flex items-center gap-1.5 py-1.5 px-3.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            <ShieldCheck className="h-4 w-4" />
            Merchant Connected
          </span>
        </div>
      </div>

      {payoutSuccessMsg && (
        <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-emerald-500 flex gap-3 text-xs animate-fade-in">
          <CheckCircle2 className="h-4.5 w-4.5 shrink-0 mt-0.5" />
          <span>{payoutSuccessMsg}</span>
        </div>
      )}

      {payoutErrorMsg && (
        <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 text-rose-500 flex gap-3 text-xs animate-fade-in">
          <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
          <span>{payoutErrorMsg}</span>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Pending Ledger Balance */}
        <div className="card p-5 space-y-2 border-emerald-500/30 relative overflow-hidden">
          <div className="flex justify-between items-center text-muted">
            <span className="text-[10px] font-bold uppercase tracking-wider">
              Pending Ledger Balance
            </span>
            <div className="h-7 w-7 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <Banknote className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-mono font-bold text-emerald-500">
            LKR {pendingBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <span className="text-[10px] text-muted block">Ready for transfer dispatch</span>
        </div>

        {/* Today's Revenue */}
        <div className="card p-5 space-y-2">
          <div className="flex justify-between items-center text-muted">
            <span className="text-[10px] font-bold uppercase tracking-wider">
              Today's Fare Revenue
            </span>
            <div className="h-7 w-7 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-mono font-bold text-[var(--color-on-surface)]">
            LKR {todayRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <span className="text-[10px] text-muted block">Deducted from active passenger taps</span>
        </div>

        {/* Auto Payout Schedule */}
        <div className="card p-5 space-y-2">
          <div className="flex justify-between items-center text-muted">
            <span className="text-[10px] font-bold uppercase tracking-wider">
              Auto-Settlement Schedule
            </span>
            <div className="h-7 w-7 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <p className="text-lg font-bold text-[var(--color-on-surface)]">
            Nightly at 00:00
          </p>
          <span className="text-[10px] text-muted block">Automated Cron Job Service</span>
        </div>

        {/* Stripe Merchant Status */}
        <div className="card p-5 space-y-2">
          <div className="flex justify-between items-center text-muted">
            <span className="text-[10px] font-bold uppercase tracking-wider">
              Stripe Connect Status
            </span>
            <div className="h-7 w-7 rounded-lg bg-sky-500/10 text-sky-500 flex items-center justify-center">
              <Zap className="h-4 w-4" />
            </div>
          </div>
          <p className="text-lg font-bold text-sky-500">
            Express Account
          </p>
          <span className="text-[10px] text-muted block">Direct Bank Account Routing</span>
        </div>
      </div>

      {/* Main Operations Grid */}
      <div className="grid gap-8 lg:grid-cols-12">
        {/* Left: Manual Payout Dispatcher (7 Columns) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="card p-6 md:p-8 space-y-6">
            <div className="flex items-center gap-3 border-b border-[var(--color-outline-variant)] pb-5">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                <Send className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[var(--color-on-surface)]">
                  Instant Payout Settlement
                </h3>
                <p className="text-xs text-muted mt-0.5">
                  Transfer accumulated journey revenues directly to your verified corporate bank account.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-5 rounded-2xl border border-[var(--color-outline-variant)] bg-[var(--color-surface-variant)]/30 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted font-medium">Available Payout Volume:</span>
                  <span className="text-base font-mono font-bold text-emerald-500">
                    LKR {pendingBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[11px] text-muted pt-2 border-t border-[var(--color-outline-variant)]/40">
                  <span>Estimated Arrival:</span>
                  <span className="font-semibold text-[var(--color-on-surface)]">Instant / 1-2 Business Days</span>
                </div>
                <div className="flex justify-between items-center text-[11px] text-muted">
                  <span>Transfer Fee:</span>
                  <span className="font-semibold text-emerald-500">0.00% (Platform Covered)</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleTriggerPayout}
                disabled={triggeringPayout || loading || pendingBalance <= 0}
                className="w-full btn-primary py-3.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/15 disabled:opacity-50 transition-all"
              >
                {triggeringPayout ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Executing Stripe Transfer Batch...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    {pendingBalance > 0
                      ? `Dispatch Payout of LKR ${pendingBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      : "No Pending Balance to Transfer"}
                  </>
                )}
              </button>
            </div>

            <div className="p-4 rounded-xl border border-[var(--color-outline-variant)] bg-[var(--color-surface-variant)]/20 text-[11px] text-muted leading-relaxed space-y-1">
              <p className="font-bold text-[var(--color-on-surface)]">How Settlements Work:</p>
              <p>
                When passengers tap their NFC smart cards or QR tickets on your buses, the computed fare is instantly deducted from their prepaid wallet and credited to your transit company's pending ledger.
              </p>
            </div>
          </div>
        </div>

        {/* Right: Merchant Details & Security Compliance (5 Columns) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="card p-6 md:p-8 space-y-6">
            <h4 className="text-sm font-bold text-[var(--color-on-surface)] uppercase tracking-wider">
              Settlement & Bank Details
            </h4>

            <div className="space-y-4 text-xs leading-relaxed text-muted">
              <div className="p-4 rounded-xl border border-[var(--color-outline-variant)] bg-[var(--color-surface-variant)]/30 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-muted">Connected Merchant:</span>
                  <span className="font-bold text-[var(--color-on-surface)]">Smart Transit Partner</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium text-muted">Currency:</span>
                  <span className="font-mono font-bold text-[var(--color-on-surface)]">LKR (Sri Lankan Rupee)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium text-muted">Verification Status:</span>
                  <span className="inline-flex items-center gap-1 font-bold text-emerald-500">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    KYC Verified
                  </span>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <div className="h-6 w-6 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldCheck className="h-3.5 w-3.5" />
                </div>
                <div>
                  <strong className="text-[var(--color-on-surface)] block mb-0.5">
                    Automated Idempotency Protection
                  </strong>
                  All payout transfers are generated with cryptographically unique daily idempotency keys to prevent duplicate bank debits.
                </div>
              </div>

              <div className="flex gap-3">
                <div className="h-6 w-6 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0 mt-0.5">
                  <Zap className="h-3.5 w-3.5" />
                </div>
                <div>
                  <strong className="text-[var(--color-on-surface)] block mb-0.5">
                    Stripe Connect Express
                  </strong>
                  Funds are settled into your linked bank account with end-to-end audit tracking across the ledger database.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
