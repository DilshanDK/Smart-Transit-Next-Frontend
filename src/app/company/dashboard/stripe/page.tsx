"use client";

import React, { useEffect, useState } from "react";
import { apiClient } from "@/core/lib/api-client";
import {
  CreditCard,
  Building,
  ArrowUpRight,
  ShieldCheck,
  RefreshCw,
  Clock,
  CheckCircle,
  HelpCircle,
  Loader2,
  DollarSign
} from "lucide-react";

interface PayoutLog {
  payoutId: string;
  amount: number;
  date: string;
  status: "SUCCESS" | "PENDING";
  bankAccount: string;
}

export default function CompanyStripeConnectPage() {
  const [balance, setBalance] = useState<number>(0);
  const [isOnboarded, setIsOnboarded] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sweeping, setSweeping] = useState(false);

  const [payoutsList, setPayoutsList] = useState<PayoutLog[]>([
    {
      payoutId: "po_1Tz98fJ8PKebNGk",
      amount: 45000.0,
      date: "2026-05-28 14:30",
      status: "SUCCESS",
      bankAccount: "Sampath Bank - **********4382"
    },
    {
      payoutId: "po_1Tz82aJ8PKebNGk",
      amount: 38200.0,
      date: "2026-05-24 10:15",
      status: "SUCCESS",
      bankAccount: "Sampath Bank - **********4382"
    }
  ]);

  const loadStripeData = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get("/company/stats");
      if (res.status === 200) {
        setBalance(res.data.pendingLedgerBalance);
        setIsOnboarded(res.data.isOnboarded);
      }
    } catch (err) {
      console.error("Failed to load company stats for Stripe Connect", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadStripeData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadStripeData();
  };

  const handleLinkBank = () => {
    alert(
      "Simulating Stripe Express Onboarding: Redirecting to Stripe Identity and Bank verification portal..."
    );
    setIsOnboarded(true);
  };

  const handlePayoutSweep = () => {
    if (balance <= 0) return;
    setSweeping(true);

    setTimeout(() => {
      const newPayout: PayoutLog = {
        payoutId: `po_${Math.random().toString(36).substring(2, 17)}`,
        amount: balance,
        date: new Date().toISOString().replace("T", " ").substring(0, 16),
        status: "SUCCESS",
        bankAccount: "Sampath Bank - **********4382"
      };

      setPayoutsList([newPayout, ...payoutsList]);
      setBalance(0);
      setSweeping(false);
      alert("Sweep request completed successfully! LKR transfer routed to Sampath Bank.");
    }, 2000);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Upper header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[var(--color-on-surface)]">
            Stripe Payouts & Ledger
          </h2>
          <p className="text-sm text-muted mt-1">
            Link merchant bank accounts and transfer passenger prepaid ticket revenues.
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing || loading}
          className="self-start sm:self-auto flex items-center gap-2 py-2.5 px-4 rounded-xl border border-[var(--color-outline-variant)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-variant)] text-xs font-bold text-[var(--color-on-surface)] cursor-pointer transition-all disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
          Sync Ledger
        </button>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center">
          <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-12">
          {/* Left panel: Balance Ledger - 7 columns */}
          <div className="lg:col-span-7 space-y-6">
            <div className="card p-6 md:p-8 space-y-6">
              <div>
                <h3 className="text-base font-bold tracking-tight">Connect Ledger Summary</h3>
                <p className="text-[11px] text-muted mt-0.5">Earnings ready for bank transfers.</p>
              </div>

              <div className="surface-variant p-6 rounded-2xl border border-[var(--color-outline-variant)] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                <div>
                  <span className="text-[10px] font-bold text-muted uppercase tracking-widest block">
                    Pending Balance
                  </span>
                  <div className="text-3xl font-black text-indigo-500 mt-1">
                    LKR {balance.toFixed(2)}
                  </div>
                  <p className="text-[10px] text-muted mt-1.5 leading-relaxed max-w-sm">
                    Revenues from passenger QR scans & NFC card validations. Transferred after Stripe Connect service fees.
                  </p>
                </div>

                <button
                  onClick={handlePayoutSweep}
                  disabled={balance <= 0 || sweeping || !isOnboarded}
                  className="btn-primary self-start sm:self-auto py-3 px-5 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-lg shadow-indigo-500/10 disabled:opacity-40"
                >
                  {sweeping ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowUpRight className="h-4 w-4" />
                  )}
                  {sweeping ? "Sweeping Account..." : "Payout to Bank"}
                </button>
              </div>

              {/* Onboarding Bank Block */}
              <div className="border border-[var(--color-outline-variant)] rounded-xl p-5 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-xs font-bold text-[var(--color-on-surface)]">
                      Stripe Connect Status
                    </h4>
                    <p className="text-[10px] text-muted mt-0.5">
                      {isOnboarded
                        ? "Payout route is active and linked to Sampath Bank."
                        : "Configure your Stripe Express account to allow payout sweeps."}
                    </p>
                  </div>
                  {isOnboarded ? (
                    <span className="inline-flex items-center gap-1 py-1 px-2 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-500">
                      <CheckCircle className="h-2.5 w-2.5" />
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 py-1 px-2 rounded-full text-[9px] font-bold bg-amber-500/10 text-amber-500">
                      <Clock className="h-2.5 w-2.5" />
                      Pending Setup
                    </span>
                  )}
                </div>

                {!isOnboarded && (
                  <button
                    onClick={handleLinkBank}
                    className="btn-primary py-2 px-4 rounded-lg text-[10px] font-bold tracking-wide flex items-center gap-1.5 cursor-pointer"
                  >
                    Setup Stripe Express Bank Link
                  </button>
                )}
              </div>
            </div>

            {/* Payout History List */}
            <div className="card p-6 md:p-8 space-y-6">
              <div>
                <h3 className="text-base font-bold tracking-tight">Payout History Ledger</h3>
                <p className="text-[11px] text-muted mt-0.5">Logs of bank sweeps routing to bank accounts.</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[var(--color-outline-variant)] text-[9px] font-bold text-muted uppercase tracking-wider pb-3">
                      <th className="pb-3">Transfer ID</th>
                      <th className="pb-3">Bank Destination</th>
                      <th className="pb-3">Amount</th>
                      <th className="pb-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-outline-variant)] text-xs">
                    {payoutsList.map((log) => (
                      <tr key={log.payoutId} className="hover:bg-[var(--color-surface-variant)]/30 transition-colors">
                        <td className="py-3.5 font-mono text-[10px] text-muted">{log.payoutId}</td>
                        <td className="py-3.5 font-semibold text-[var(--color-on-surface)]">{log.bankAccount}</td>
                        <td className="py-3.5 font-semibold font-mono text-emerald-500">LKR {log.amount.toFixed(2)}</td>
                        <td className="py-3.5 text-right">
                          <span className="inline-flex items-center gap-1 py-0.5 px-2 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-500">
                            Success
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right panel: Help & Info - 5 columns */}
          <div className="lg:col-span-5 space-y-6">
            <div className="card p-6 md:p-8 space-y-6">
              <div className="flex items-center gap-2">
                <HelpCircle className="h-4.5 w-4.5 text-indigo-500" />
                <h3 className="text-base font-bold tracking-tight">Merchant Help Desk</h3>
              </div>

              <div className="space-y-4 text-[11px] text-muted leading-relaxed">
                <div>
                  <h4 className="font-bold text-[var(--color-on-surface)]">How do sweeps work?</h4>
                  <p className="mt-1">
                    Ticketing deductions are processed directly to your pending ledger balance. Manual sweep transfers clear balances instantly, routing to Sampath Bank within 24 hours.
                  </p>
                </div>
                <div>
                  <h4 className="font-bold text-[var(--color-on-surface)]">Daily Schedule Sweeps</h4>
                  <p className="mt-1">
                    If you prefer not to use manual sweeps, the daily midnight CRON task automatically sweeps your ledger balance.
                  </p>
                </div>
                <div>
                  <h4 className="font-bold text-[var(--color-on-surface)]">Stripe Connect Express Fees</h4>
                  <p className="mt-1">
                    Stripe charges a nominal gateway fee on passenger cards (approx 2.5% + LKR 10). The transit portal routes 90% of ticket values directly to you.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
