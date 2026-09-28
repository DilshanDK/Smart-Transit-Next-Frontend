"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/core/context/AuthContext";
import { apiClient } from "@/core/lib/api-client";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import {
  Wallet,
  ArrowUpRight,
  TrendingDown,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  Zap,
  Info,
  DollarSign,
  ChevronRight,
  PlusCircle,
  MinusCircle,
  Bus
} from "lucide-react";
import Cookies from "js-cookie";

// Initialize Stripe publishable key
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "");

interface Transaction {
  _id: string;
  type: "WALLET_TOPUP" | "JOURNEY_DEDUCTION";
  amount: { $numberDecimal?: string } | any;
  createdAt: string;
  stripePaymentIntentId?: string;
  journeyId?: string;
  routeId?: string;
}

export default function WalletPage() {
  const { user, refreshProfile } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(true);
  const [topUpAmount, setTopUpAmount] = useState<number>(500);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [isSandbox, setIsSandbox] = useState<boolean>(false); // Default to Sandbox for easy local dev
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loadingIntent, setLoadingIntent] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch transactions on mount
  const fetchTransactions = async () => {
    try {
      setLoadingTransactions(true);
      const res = await apiClient.get("/payment/transactions");
      if (res.status === 200) {
        setTransactions(res.data);
      }
    } catch (err) {
      console.error("Failed to load transactions", err);
    } finally {
      setLoadingTransactions(false);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const redirectStatus = urlParams.get("redirect_status");
      
      if (redirectStatus === "succeeded") {
        setSuccessMessage("Payment complete! Funds have been added to your wallet.");
        setTimeout(() => setSuccessMessage(null), 8000);
        window.history.replaceState(null, "", window.location.pathname);
        
        // Fetch immediately (in case webhook was super fast)
        refreshProfile();
        
        // Poll for balance update because the background Stripe webhook can take several seconds
        const currentBalanceStr = String((user as any)?.walletBalance?.$numberDecimal ?? (user as any)?.walletBalance ?? 0);
        let attempts = 0;
        const maxAttempts = 15; // 30 seconds max
        
        const pollTimer = setInterval(async () => {
          attempts++;
          try {
            const res = await apiClient.get('/auth/me');
            if (res.status === 200) {
              const newBalanceStr = String(res.data.user?.walletBalance?.$numberDecimal ?? res.data.user?.walletBalance ?? 0);
              if (newBalanceStr !== currentBalanceStr) {
                // Balance updated by webhook!
                refreshProfile();
                fetchTransactions();
                clearInterval(pollTimer);
              }
            }
          } catch (e) {}
          
          if (attempts >= maxAttempts) {
            clearInterval(pollTimer);
            refreshProfile();
            fetchTransactions();
          }
        }, 2000);
      } else if (redirectStatus === "failed") {
        setErrorMessage("Payment failed. Please try again.");
        setTimeout(() => setErrorMessage(null), 8000);
        window.history.replaceState(null, "", window.location.pathname);
      }
    }
    fetchTransactions();
  }, [refreshProfile]);

  const handlePresetSelect = (amount: number) => {
    setTopUpAmount(amount);
    setCustomAmount("");
    setClientSecret(null);
  };

  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomAmount(e.target.value);
    const num = parseFloat(e.target.value);
    if (!isNaN(num) && num > 0) {
      setTopUpAmount(num);
    }
    setClientSecret(null);
  };

  // Direct Sandbox (Dev) top-up bypass
  const handleSandboxTopUp = async () => {
    setLoadingIntent(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await apiClient.post("/payment/sandbox-credit", {
        amount: topUpAmount
      });

      if (res.status === 201 || res.status === 200) {
        setSuccessMessage(`Successfully added LKR ${topUpAmount.toFixed(2)} to your wallet!`);
        await refreshProfile();
        await fetchTransactions();
        setTimeout(() => setSuccessMessage(null), 5000);
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || "Failed to process sandbox credit");
    } finally {
      setLoadingIntent(false);
    }
  };

  // Stripe Session Intent Initialization
  const handleStripeIntentInit = async () => {
    if (topUpAmount < 500) {
      setErrorMessage("Minimum top-up amount using card is LKR 500.00 due to Stripe limitations.");
      return;
    }

    setLoadingIntent(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await apiClient.post("/payment/intent", {
        amount: topUpAmount
      });

      if (res.status === 201 || res.status === 200) {
        setClientSecret(res.data.clientSecret);
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || "Failed to initialize Stripe Payment Intent");
    } finally {
      setLoadingIntent(false);
    }
  };

  const handleTopUpSubmit = () => {
    if (isSandbox) {
      handleSandboxTopUp();
    } else {
      handleStripeIntentInit();
    }
  };

  // Group transaction spendings to build the custom CSS bar chart
  const getLast7DaysStats = () => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const stats = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return {
        day: days[d.getDay()],
        dateStr: d.toDateString(),
        amount: 0
      };
    }).reverse();

    transactions.forEach((tx) => {
      if (tx.type === "JOURNEY_DEDUCTION") {
        const txDate = new Date(tx.createdAt).toDateString();
        const statDay = stats.find((s) => s.dateStr === txDate);
        if (statDay) {
          const amtStr = tx.amount?.$numberDecimal || tx.amount?.toString() || "0";
          statDay.amount += parseFloat(amtStr);
        }
      }
    });

    const maxAmt = Math.max(...stats.map((s) => s.amount), 100);
    return stats.map((s) => ({
      ...s,
      percent: Math.min((s.amount / maxAmt) * 100, 100)
    }));
  };

  const chartData = getLast7DaysStats();

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Prepaid Wallet</h2>
        <p className="text-sm text-muted mt-1">Manage transit credits and review transaction histories.</p>
      </div>

      {/* Grid Layout */}
      <div className="grid gap-8 lg:grid-cols-12">
        {/* Left Section (Card & Top Up Form) - 7 cols */}
        <div className="lg:col-span-7 space-y-6">
          {/* Credit Card Graphic */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-[var(--color-primary)] to-emerald-500 text-white shadow-xl p-8 flex flex-col justify-between w-full min-h-[220px] md:min-h-[250px] select-none">
            {/* Hologram card detail */}
            <div className="absolute right-0 top-0 w-48 h-48 bg-white/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/70">Smart Transit Card</span>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-semibold bg-white/10 px-2 py-0.5 rounded-full text-emerald-300">Active</span>
                </div>
              </div>
              <div className="h-9 w-12 bg-white/10 rounded-lg flex items-center justify-center backdrop-blur-md">
                <Wallet className="h-5 w-5 text-white/80" />
              </div>
            </div>

            <div className="space-y-1 my-4">
              <span className="text-xs text-white/60 font-bold uppercase tracking-widest">Available Balance</span>
              <div className="text-4xl font-extrabold tracking-tight">
                LKR {user?.walletBalance !== undefined ? parseFloat(String((user as any).walletBalance?.$numberDecimal ?? (user as any).walletBalance ?? 0)).toFixed(2) : "0.00"}
              </div>
            </div>

            <div className="flex justify-between items-end border-t border-white/10 pt-4">
              <div>
                <span className="text-[10px] text-white/50 uppercase block tracking-wider">Card Holder</span>
                <span className="text-sm font-bold tracking-wide">{user?.fullName || "Transit Passenger"}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-white/50 uppercase block tracking-wider">Passenger ID</span>
                <span className="text-xs font-mono font-bold text-white/80">
                  {user?.id ? `ST-${user.id.substring(user.id.length - 8).toUpperCase()}` : "ST-00000000"}
                </span>
              </div>
            </div>
          </div>

          {/* Top Up Panel */}
          <div className="card p-6 md:p-8 space-y-6">
            <h3 className="text-base font-bold tracking-tight">Add Funds</h3>
            
            {/* Presets Grid */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted uppercase tracking-wider">Select Preset Amount</label>
              <div className="grid grid-cols-4 gap-3">
                {[500, 1000, 2000, 5000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => handlePresetSelect(amt)}
                    className={`py-3 rounded-xl font-bold text-sm border transition-all cursor-pointer ${
                      topUpAmount === amt && !customAmount
                        ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-white shadow-sm"
                        : "border-[var(--color-outline-variant)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-variant)] text-[var(--color-on-surface)]"
                    }`}
                  >
                    LKR {amt}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Input */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted uppercase tracking-wider">Or Enter Custom Amount</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-sm font-extrabold text-muted">
                  LKR
                </div>
                <input
                  type="number"
                  min="500"
                  placeholder="Minimum LKR 500.00"
                  value={customAmount}
                  onChange={handleCustomAmountChange}
                  className="w-full pl-13 pr-4 py-3 rounded-xl border border-[var(--color-outline-variant)] bg-[var(--color-surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-[var(--color-on-surface)]"
                />
              </div>
            </div>

            {/* Error Modal Popup */}
            {errorMessage && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                <div className="bg-[var(--color-surface)] w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden flex flex-col items-center text-center p-8 animate-in zoom-in-50 duration-300 ease-out">
                  <div className="h-20 w-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6 relative">
                    <div className="absolute inset-0 bg-red-500/20 rounded-full animate-ping opacity-75" />
                    <AlertCircle className="h-10 w-10 text-red-500 relative z-10" />
                  </div>
                  <h3 className="text-xl font-extrabold mb-2 text-[var(--color-on-surface)]">Payment Failed</h3>
                  <p className="text-sm text-muted font-medium mb-8 leading-relaxed">
                    {errorMessage}
                  </p>
                  <button
                    onClick={() => setErrorMessage(null)}
                    className="w-full btn-primary py-3.5 rounded-xl font-bold text-sm bg-red-600 hover:bg-red-700 text-white transition-colors border-none"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            )}

            {/* Success Modal Popup */}
            {successMessage && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                <div className="bg-[var(--color-surface)] w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden flex flex-col items-center text-center p-8 animate-in zoom-in-50 duration-300 ease-out">
                  <div className="h-20 w-20 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6 relative">
                    <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping opacity-75" />
                    <CheckCircle2 className="h-10 w-10 text-emerald-500 relative z-10" />
                  </div>
                  <h3 className="text-xl font-extrabold mb-2 text-[var(--color-on-surface)]">Payment Successful!</h3>
                  <p className="text-sm text-muted font-medium mb-8 leading-relaxed">
                    {successMessage}
                  </p>
                  <button
                    onClick={() => setSuccessMessage(null)}
                    className="w-full btn-primary py-3.5 rounded-xl font-bold text-sm bg-emerald-600 hover:bg-emerald-700 text-white transition-colors border-none"
                  >
                    Awesome
                  </button>
                </div>
              </div>
            )}

            {/* Submit Trigger */}
            {!clientSecret && (
              <button
                type="button"
                disabled={loadingIntent || topUpAmount < 50}
                onClick={handleTopUpSubmit}
                className="w-full btn-primary py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loadingIntent ? (
                  <span className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : isSandbox ? (
                  <>
                    <Zap className="h-4 w-4" />
                    Load Instantly (Sandbox)
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Initialize Stripe Payment
                  </>
                )}
              </button>
            )}

            {/* Sandbox Dev Mode Toggle */}
            <div className="flex items-center justify-between p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 mt-4">
              <div className="flex gap-3 items-start pr-4">
                <Zap className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-amber-600 dark:text-amber-500">Developer Sandbox Mode</h4>
                  <p className="text-[11px] text-muted mt-0.5 leading-relaxed">
                    Instantly credit wallet balance directly to MongoDB without setting up Stripe webhooks/tunnels.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsSandbox(!isSandbox);
                  setClientSecret(null);
                }}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  isSandbox ? "bg-amber-500" : "bg-neutral-300 dark:bg-neutral-800"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    isSandbox ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Stripe Card Element Modal View */}
            {clientSecret && !isSandbox && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                <div className="bg-[var(--color-surface)] w-full max-w-md rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-300">
                  <div className="bg-[var(--color-surface-variant)] px-6 py-4 border-b border-[var(--color-outline-variant)] flex items-center justify-between shrink-0">
                    <h4 className="font-bold flex items-center gap-2">
                      <Zap className="h-4 w-4 text-[var(--color-primary)]" />
                      Secure Checkout
                    </h4>
                    <button 
                      onClick={() => setClientSecret(null)} 
                      className="h-8 w-8 rounded-full bg-[var(--color-outline-variant)]/50 hover:bg-[var(--color-outline-variant)] flex items-center justify-center text-muted hover:text-foreground transition-colors shrink-0"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="p-6 overflow-y-auto">
                    <Elements stripe={stripePromise} options={{ clientSecret }}>
                      <StripeCheckoutForm
                        clientSecret={clientSecret}
                        amount={topUpAmount}
                        onSuccess={async () => {
                          setSuccessMessage(`Payment complete! LKR ${topUpAmount.toFixed(2)} added successfully.`);
                          setClientSecret(null);
                          
                          // Poll for balance update because the background Stripe webhook can take several seconds
                          const currentBalanceStr = String((user as any)?.walletBalance?.$numberDecimal ?? (user as any)?.walletBalance ?? 0);
                          let attempts = 0;
                          const maxAttempts = 15; // 30 seconds max
                          
                          // Fetch immediately just in case
                          await refreshProfile();
                          
                          const pollTimer = setInterval(async () => {
                            attempts++;
                            try {
                              const res = await apiClient.get('/auth/me');
                              if (res.status === 200) {
                                const newBalanceStr = String(res.data.user?.walletBalance?.$numberDecimal ?? res.data.user?.walletBalance ?? 0);
                                if (newBalanceStr !== currentBalanceStr) {
                                  // Balance updated by webhook!
                                  await refreshProfile();
                                  await fetchTransactions();
                                  clearInterval(pollTimer);
                                }
                              }
                            } catch (e) {}
                            
                            if (attempts >= maxAttempts) {
                              clearInterval(pollTimer);
                              await refreshProfile();
                              await fetchTransactions();
                            }
                          }, 2000);
                          
                          setTimeout(() => setSuccessMessage(null), 5000);
                        }}
                        onCancel={() => setClientSecret(null)}
                      />
                    </Elements>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Section (Stats & Transactions List) - 5 cols */}
        <div className="lg:col-span-5 space-y-6">
          {/* Custom Spending Chart */}
          <div className="card p-6 md:p-8 space-y-6">
            <div>
              <h3 className="text-base font-bold tracking-tight">Expense Heatmap</h3>
              <p className="text-[11px] text-muted mt-0.5">Deduction totals for the last 7 calendar days.</p>
            </div>

            {/* Custom SVG/CSS Bar Chart */}
            <div className="h-36 flex items-end justify-between gap-2.5 pt-6 px-1">
              {chartData.map((d, index) => (
                <div key={index} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                  <div className="relative w-full flex justify-center group-hover:scale-105 transition-transform duration-200">
                    {/* Hover Tooltip */}
                    <div className="absolute top-[-28px] scale-0 group-hover:scale-100 bg-neutral-900 text-white dark:bg-white dark:text-black text-[9px] font-bold py-1 px-1.5 rounded shadow pointer-events-none transition-all duration-200 z-10 whitespace-nowrap">
                      LKR {d.amount.toFixed(0)}
                    </div>
                    {/* Visual Bar */}
                    <div
                      className="w-4 rounded-t-md bg-gradient-to-t from-[var(--color-primary)] to-emerald-500 opacity-80 group-hover:opacity-100 transition-all duration-200"
                      style={{ height: `${Math.max(d.percent, 4)}px` }}
                    />
                  </div>
                  <span className="text-[10px] font-bold text-muted select-none">{d.day}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Transactions List */}
          <div className="card p-6 md:p-8 space-y-6">
            <div>
              <h3 className="text-base font-bold tracking-tight">Ledger Logs</h3>
              <p className="text-[11px] text-muted mt-0.5">List of transaction history logs.</p>
            </div>

            {loadingTransactions ? (
              <div className="py-8 flex justify-center">
                <div className="h-6 w-6 rounded-full border-2 border-[var(--color-primary)] border-t-transparent animate-spin" />
              </div>
            ) : transactions.length === 0 ? (
              <div className="surface-variant py-10 flex flex-col items-center justify-center text-center px-4">
                <Clock className="h-8 w-8 text-muted opacity-30 mb-3" />
                <p className="text-xs font-bold text-muted">No transactions found</p>
                <p className="text-[10px] text-muted mt-0.5 max-w-[200px]">
                  Add funds or take trips to populate transactions.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[var(--color-outline-variant)] max-h-96 overflow-y-auto pr-1">
                {transactions.slice(0, 10).map((tx) => {
                  const isTopUp = tx.type === "WALLET_TOPUP";
                  const amtStr = tx.amount?.$numberDecimal || tx.amount?.toString() || "0";
                  const amount = parseFloat(amtStr);
                  const date = new Date(tx.createdAt).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric"
                  });
                  const time = new Date(tx.createdAt).toLocaleTimeString(undefined, {
                    hour: "2-digit",
                    minute: "2-digit"
                  });

                  return (
                    <div key={tx._id} className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                          isTopUp ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
                        }`}>
                          {isTopUp ? <PlusCircle className="h-4 w-4" /> : <Bus className="h-4 w-4" />}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[var(--color-on-surface)]">
                            {isTopUp 
                              ? `Top-Up ${tx.stripePaymentIntentId?.startsWith("sandbox_") ? "(Sandbox)" : "(Stripe)"}` 
                              : `Ride Ticket Charge`
                            }
                          </p>
                          <p className="text-[10px] text-muted mt-0.5">
                            {date} at {time}
                          </p>
                        </div>
                      </div>
                      <span className={`text-xs font-extrabold ${isTopUp ? "text-emerald-500" : "text-[var(--color-on-surface)]"}`}>
                        {isTopUp ? "+" : "-"} LKR {amount.toFixed(2)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Inner Component for Stripe Elements execution
function StripeCheckoutForm({
  clientSecret,
  amount,
  onSuccess,
  onCancel
}: {
  clientSecret: string;
  amount: number;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState<boolean>(false);
  const [stripeError, setStripeError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);
    setStripeError(null);

    // Confirm the payment directly via Stripe SDK
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.href // Redirects back here on completion
      },
      redirect: "if_required" // Let Stripe handle it inline if possible without redirection
    });

    if (error) {
      setStripeError(error.message || "An error occurred with your payment.");
      setProcessing(false);
    } else if (paymentIntent && paymentIntent.status === "succeeded") {
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      {stripeError && (
        <div className="p-3 rounded-lg border border-red-500/20 bg-red-500/5 text-red-500 text-xs flex gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{stripeError}</span>
        </div>
      )}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={processing}
          className="flex-1 py-2.5 border border-[var(--color-outline-variant)] text-xs font-bold rounded-xl hover:bg-[var(--color-surface-variant)] text-[var(--color-on-surface)] transition-all cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!stripe || processing}
          className="flex-1 btn-primary py-2.5 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          {processing ? (
            <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            `Pay LKR ${amount.toFixed(2)}`
          )}
        </button>
      </div>
    </form>
  );
}
