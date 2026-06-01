"use client";

import React, { useEffect, useState } from "react";
import { apiClient } from "@/core/lib/api-client";
import {
  Building2,
  TrendingUp,
  Bus,
  Users,
  Compass,
  DollarSign,
  ArrowUpRight,
  ShieldCheck,
  AlertCircle,
  Bell,
  RefreshCw,
  Clock,
  ChevronRight,
  TrendingDown
} from "lucide-react";
import Link from "next/link";

interface Stats {
  dailyRevenue: number;
  activeDrivers: number;
  activeBuses: number;
  totalJourneys: number;
  pendingLedgerBalance: number;
  isOnboarded: boolean;
}

interface RouteStat {
  routeId: string;
  revenue: number;
  trips: number;
}

export default function CompanyDashboardOverview() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [routeStats, setRouteStats] = useState<RouteStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, routeStatsRes] = await Promise.all([
        apiClient.get("/company/stats"),
        apiClient.get("/company/reports/by-route")
      ]);

      if (statsRes.status === 200) {
        setStats(statsRes.data);
      }
      if (routeStatsRes.status === 200) {
        setRouteStats(routeStatsRes.data);
      }
    } catch (err) {
      console.error("Failed to load dashboard operational stats", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const getKPIs = () => {
    if (!stats) return [];
    return [
      {
        title: "Daily Operations Revenue",
        value: `LKR ${stats.dailyRevenue.toFixed(2)}`,
        desc: "Today's ticket deductions",
        icon: DollarSign,
        color: "text-emerald-500",
        bg: "bg-emerald-500/10"
      },
      {
        title: "Active Staff On Shift",
        value: stats.activeDrivers.toString(),
        desc: "Drivers currently reporting GPS",
        icon: Users,
        color: "text-indigo-500",
        bg: "bg-indigo-500/10"
      },
      {
        title: "Fleet Fleet Deployments",
        value: stats.activeBuses.toString(),
        desc: "Active unique bus registrations",
        icon: Bus,
        color: "text-sky-500",
        bg: "bg-sky-500/10"
      },
      {
        title: "Today's Journey Volume",
        value: stats.totalJourneys.toString(),
        desc: "Tap-on & Tap-off transactions",
        icon: Compass,
        color: "text-amber-500",
        bg: "bg-amber-500/10"
      }
    ];
  };

  const kpis = getKPIs();

  // Mock peak hour distributions for aesthetic layout
  const mockPeakHours = [
    { hour: "06:00", volume: 45 },
    { hour: "08:00", volume: 95 },
    { hour: "10:00", volume: 30 },
    { hour: "12:00", volume: 60 },
    { hour: "14:00", volume: 55 },
    { hour: "16:00", volume: 88 },
    { hour: "18:00", volume: 75 }
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Upper header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[var(--color-on-surface)]">
            Operations Control Panel
          </h2>
          <p className="text-sm text-muted mt-1">
            Real-time fleet performance indicators and transaction statistics.
          </p>
        </div>
        
        <button
          onClick={handleRefresh}
          disabled={refreshing || loading}
          className="self-start sm:self-auto flex items-center gap-2 py-2.5 px-4 rounded-xl border border-[var(--color-outline-variant)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-variant)] text-xs font-bold text-[var(--color-on-surface)] cursor-pointer transition-all disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
          {refreshing ? "Refreshing Operations..." : "Sync Console"}
        </button>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center">
          <div className="h-8 w-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
        </div>
      ) : (
        <>
          {/* Stripe onboarding warning if company not onboarded */}
          {stats && !stats.isOnboarded && (
            <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex gap-3 items-start">
                <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-amber-600 dark:text-amber-500">Stripe Connect Bank Setup Required</h4>
                  <p className="text-[11px] text-muted mt-0.5 max-w-lg leading-relaxed">
                    Your Stripe Connect payout account is currently unlinked. To transfer your pending LKR balance, you must configure a bank account.
                  </p>
                </div>
              </div>
              <Link
                href="/company/dashboard/stripe"
                className="btn-primary py-2 px-4.5 rounded-lg text-[10px] font-bold tracking-wide flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                Onboard Bank Account
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          )}

          {/* KPI Dashboard Row */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {kpis.map((kpi, idx) => {
              const Icon = kpi.icon;
              return (
                <div key={idx} className="card p-6 space-y-4 hover:scale-[1.01] transition-transform duration-200">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-muted uppercase tracking-wider">
                      {kpi.title}
                    </span>
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${kpi.color} ${kpi.bg}`}>
                      <Icon className="h-4.5 w-4.5" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-[var(--color-on-surface)]">
                      {kpi.value}
                    </h3>
                    <p className="text-[10px] text-muted mt-1 leading-relaxed">{kpi.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Graphs Layout */}
          <div className="grid gap-8 lg:grid-cols-12">
            {/* Left section: Route distribution - 7 cols */}
            <div className="lg:col-span-7 space-y-6">
              <div className="card p-6 md:p-8 space-y-6">
                <div>
                  <h3 className="text-base font-bold tracking-tight">Route Revenue Analytics</h3>
                  <p className="text-[11px] text-muted mt-0.5">Trips volume and net deductions per route.</p>
                </div>

                {routeStats.length === 0 ? (
                  <div className="surface-variant py-10 flex flex-col items-center justify-center text-center px-4 rounded-xl border border-[var(--color-outline-variant)]">
                    <Compass className="h-8 w-8 text-muted opacity-30 mb-3" />
                    <p className="text-xs font-bold text-muted">No route metrics available</p>
                    <p className="text-[10px] text-muted mt-0.5">
                      Journeys will populate this chart dynamically.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {routeStats.map((item, idx) => {
                      const maxRev = Math.max(...routeStats.map(r => r.revenue), 1);
                      const widthPercent = (item.revenue / maxRev) * 100;
                      return (
                        <div key={idx} className="space-y-2">
                          <div className="flex justify-between text-xs font-bold">
                            <span className="text-[var(--color-on-surface)]">Route {item.routeId}</span>
                            <div className="space-x-3">
                              <span className="text-muted">{item.trips} Trips</span>
                              <span className="text-indigo-500">LKR {item.revenue.toFixed(2)}</span>
                            </div>
                          </div>
                          <div className="h-2 w-full bg-[var(--color-surface-variant)] rounded-full overflow-hidden border border-[var(--color-outline-variant)]">
                            <div
                              className="h-full bg-gradient-to-r from-indigo-500 to-sky-500 transition-all duration-300 rounded-full"
                              style={{ width: `${widthPercent}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Stripe Transfer Ledger Widget */}
              <div className="card p-6 md:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-muted uppercase tracking-widest block">
                    Pending Ledger Summary
                  </span>
                  <div className="text-3xl font-black text-indigo-500">
                    LKR {stats?.pendingLedgerBalance !== undefined ? stats.pendingLedgerBalance.toFixed(2) : "0.00"}
                  </div>
                  <p className="text-[10px] text-muted leading-relaxed max-w-sm">
                    Prepaid ticketing balances ready to be swept to your bank account. Deducting Stripe service fees.
                  </p>
                </div>
                <Link
                  href="/company/dashboard/stripe"
                  className="btn-primary self-start sm:self-auto py-3 px-5 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-lg shadow-indigo-500/10"
                >
                  Manage Payout Ledger
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* Right section: Peak Travel Hours - 5 cols */}
            <div className="lg:col-span-5 space-y-6">
              <div className="card p-6 md:p-8 space-y-6">
                <div>
                  <h3 className="text-base font-bold tracking-tight">Peak Load Hours</h3>
                  <p className="text-[11px] text-muted mt-0.5">Average passenger capacity volume by hour.</p>
                </div>

                {/* Vertical CSS Bar Heatmap */}
                <div className="h-32 flex items-end justify-between gap-1.5 pt-6 px-1">
                  {mockPeakHours.map((h, index) => (
                    <div key={index} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                      <div className="relative w-full flex justify-center group-hover:scale-105 transition-transform duration-200">
                        {/* Hover Tooltip */}
                        <div className="absolute top-[-28px] scale-0 group-hover:scale-100 bg-neutral-900 text-white dark:bg-white dark:text-black text-[9px] font-bold py-1 px-1.5 rounded shadow pointer-events-none transition-all duration-200 z-10 whitespace-nowrap">
                          {h.volume}% Capacity
                        </div>
                        {/* Visual Bar */}
                        <div
                          className="w-3.5 rounded-t-md bg-indigo-500 transition-all duration-200"
                          style={{
                            height: `${h.volume}%`,
                            opacity: h.volume > 80 ? 1 : h.volume > 50 ? 0.8 : 0.6
                          }}
                        />
                      </div>
                      <span className="text-[9px] font-bold text-muted select-none">{h.hour}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* System Alerts Console Feed */}
              <div className="card p-6 md:p-8 space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-base font-bold tracking-tight">Operations Log</h3>
                  <Bell className="h-4 w-4 text-muted animate-pulse" />
                </div>

                <div className="divide-y divide-[var(--color-outline-variant)] text-[11px] text-muted max-h-56 overflow-y-auto pr-1">
                  <div className="py-2.5 flex items-start gap-2.5">
                    <Clock className="h-3.5 w-3.5 shrink-0 text-indigo-500 mt-0.5" />
                    <div>
                      <span className="font-bold text-[var(--color-on-surface)]">Driver Shift Bound</span>
                      <p className="mt-0.5">WP-4389 registration registered by staff member John.</p>
                    </div>
                  </div>
                  <div className="py-2.5 flex items-start gap-2.5">
                    <Clock className="h-3.5 w-3.5 shrink-0 text-emerald-500 mt-0.5" />
                    <div>
                      <span className="font-bold text-[var(--color-on-surface)]">Tap On Verified</span>
                      <p className="mt-0.5">Passenger boarding complete on Route 138 (Bus WP-4389).</p>
                    </div>
                  </div>
                  <div className="py-2.5 flex items-start gap-2.5">
                    <Clock className="h-3.5 w-3.5 shrink-0 text-sky-500 mt-0.5" />
                    <div>
                      <span className="font-bold text-[var(--color-on-surface)]">GPS Tracking Ping</span>
                      <p className="mt-0.5">Live tracking telemetry synced to client views for Route 138.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
