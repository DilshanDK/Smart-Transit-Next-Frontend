"use client";

import React, { useEffect, useState } from "react";
import { apiClient } from "@/core/lib/api-client";
import {
  TrendingUp,
  Download,
  Calendar,
  Compass,
  ArrowUpRight,
  TrendingDown,
  DollarSign,
  Users,
  Loader2,
  AlertCircle
} from "lucide-react";

interface RouteReport {
  routeId: string;
  revenue: number;
  trips: number;
}

export default function CompanyReportsPage() {
  const [routeData, setRouteData] = useState<RouteReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Date Filters
  const [startDate, setStartDate] = useState("2026-05-01");
  const [endDate, setEndDate] = useState("2026-06-01");

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get("/company/reports/by-route");
      if (res.status === 200) {
        setRouteData(res.data);
      }
    } catch (err) {
      console.error("Failed to load route reports", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const res = await apiClient.get("/company/reports/export", {
        params: {
          from: startDate,
          to: endDate,
        },
        responseType: "blob",
      });

      const blob = new Blob([res.data], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `transit_earnings_${startDate}_to_${endDate}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to generate CSV download", err);
    } finally {
      setExporting(false);
    }
  };

  // Mock daily revenue data for custom SVG chart
  const dailyEarnings = [
    { day: "May 24", revenue: 45000 },
    { day: "May 25", revenue: 58000 },
    { day: "May 26", revenue: 49000 },
    { day: "May 27", revenue: 62000 },
    { day: "May 28", revenue: 75000 },
    { day: "May 29", revenue: 68000 },
    { day: "May 30", revenue: 84000 }
  ];

  const maxDailyRevenue = Math.max(...dailyEarnings.map((d) => d.revenue), 1);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Upper header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[var(--color-on-surface)]">
            Revenue & Operations Audit
          </h2>
          <p className="text-sm text-muted mt-1">
            Aggregate fares, print CSV transaction journals, and evaluate route returns.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          disabled={exporting || loading || routeData.length === 0}
          className="btn-primary py-2.5 px-5 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-500/10 disabled:opacity-50"
        >
          {exporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          {exporting ? "Formatting..." : "Export CSV Journals"}
        </button>
      </div>

      {/* Date Filter Panel */}
      <div className="card p-5 flex flex-col sm:flex-row items-center gap-4">
        <div className="flex items-center gap-2 text-xs font-bold text-muted uppercase tracking-wider shrink-0">
          <Calendar className="h-4 w-4 text-indigo-500" />
          <span>Audit Period:</span>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-[var(--color-outline-variant)] bg-[var(--color-surface-variant)] text-xs text-[var(--color-on-surface)] focus:outline-none focus:border-indigo-500"
          />
          <span className="text-xs text-muted">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-[var(--color-outline-variant)] bg-[var(--color-surface-variant)] text-xs text-[var(--color-on-surface)] focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center">
          <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-12">
          {/* Daily Revenue Chart - 7 Columns */}
          <div className="lg:col-span-7 space-y-6">
            <div className="card p-6 md:p-8 space-y-6">
              <div>
                <h3 className="text-base font-bold tracking-tight">Daily Financial Trend</h3>
                <p className="text-[11px] text-muted mt-0.5">Fares collected across all company shifts.</p>
              </div>

              {/* Custom SVG Line Area Chart */}
              <div className="h-56 relative pt-4">
                {/* SVG Graph Grid lines */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none text-[8px] font-mono text-muted pl-12 pb-6 border-b border-l border-[var(--color-outline-variant)]">
                  <div className="w-full text-right border-t border-[var(--color-outline-variant)]/30 pt-1">
                    LKR 90K
                  </div>
                  <div className="w-full text-right border-t border-[var(--color-outline-variant)]/30 pt-1">
                    LKR 60K
                  </div>
                  <div className="w-full text-right border-t border-[var(--color-outline-variant)]/30 pt-1">
                    LKR 30K
                  </div>
                  <div className="w-full text-right pt-1">LKR 0</div>
                </div>

                {/* SVG Canvas */}
                <div className="w-full h-full pl-12 pb-6 relative z-10">
                  <svg className="w-full h-full" viewBox="0 0 500 150" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                      </linearGradient>
                    </defs>

                    {/* Area path */}
                    <path
                      d={`M 0,150 
                          L 0,${150 - (dailyEarnings[0].revenue / 90000) * 150} 
                          L 83,${150 - (dailyEarnings[1].revenue / 90000) * 150} 
                          L 166,${150 - (dailyEarnings[2].revenue / 90000) * 150} 
                          L 249,${150 - (dailyEarnings[3].revenue / 90000) * 150} 
                          L 332,${150 - (dailyEarnings[4].revenue / 90000) * 150} 
                          L 415,${150 - (dailyEarnings[5].revenue / 90000) * 150} 
                          L 500,${150 - (dailyEarnings[6].revenue / 90000) * 150} 
                          L 500,150 Z`}
                      fill="url(#areaGradient)"
                    />

                    {/* Line path */}
                    <path
                      d={`M 0,${150 - (dailyEarnings[0].revenue / 90000) * 150} 
                          L 83,${150 - (dailyEarnings[1].revenue / 90000) * 150} 
                          L 166,${150 - (dailyEarnings[2].revenue / 90000) * 150} 
                          L 249,${150 - (dailyEarnings[3].revenue / 90000) * 150} 
                          L 332,${150 - (dailyEarnings[4].revenue / 90000) * 150} 
                          L 415,${150 - (dailyEarnings[5].revenue / 90000) * 150} 
                          L 500,${150 - (dailyEarnings[6].revenue / 90000) * 150}`}
                      fill="none"
                      stroke="#6366f1"
                      strokeWidth="2.5"
                    />
                  </svg>
                  
                  {/* Bottom Day labels */}
                  <div className="absolute bottom-0 left-12 right-0 flex justify-between text-[9px] font-bold text-muted pt-2 select-none">
                    {dailyEarnings.map((d, index) => (
                      <span key={index}>{d.day}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Route Performance Share - 5 Columns */}
          <div className="lg:col-span-5 space-y-6">
            <div className="card p-6 md:p-8 space-y-6">
              <div>
                <h3 className="text-base font-bold tracking-tight">Route Returns Share</h3>
                <p className="text-[11px] text-muted mt-0.5">Route revenue distributions derived from DB aggregates.</p>
              </div>

              {routeData.length === 0 ? (
                <div className="surface-variant py-10 flex flex-col items-center justify-center text-center px-4 rounded-xl border border-[var(--color-outline-variant)]">
                  <Compass className="h-8 w-8 text-muted opacity-30 mb-3" />
                  <p className="text-xs font-bold text-muted">No route metrics logged</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {routeData.map((item, idx) => {
                    const totalRevenue = routeData.reduce((acc, curr) => acc + curr.revenue, 0);
                    const percentage = totalRevenue > 0 ? (item.revenue / totalRevenue) * 100 : 0;

                    return (
                      <div key={idx} className="space-y-1.5">
                        <div className="flex justify-between text-xs font-bold text-[var(--color-on-surface)]">
                          <span>Route {item.routeId}</span>
                          <span className="text-indigo-500">{percentage.toFixed(0)}%</span>
                        </div>
                        <div className="flex justify-between text-[10px] text-muted font-mono">
                          <span>{item.trips} Trips Completed</span>
                          <span>LKR {item.revenue.toFixed(2)}</span>
                        </div>
                        <div className="h-2 w-full bg-[var(--color-surface-variant)] rounded-full overflow-hidden border border-[var(--color-outline-variant)]">
                          <div
                            className="h-full bg-gradient-to-r from-indigo-500 to-sky-500 rounded-full transition-all duration-300"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Audit Logs Warning Card */}
            <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 flex gap-3">
              <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-amber-600 dark:text-amber-500">
                  Daily Verification Checklist
                </h4>
                <p className="text-[10px] text-muted mt-1 leading-relaxed">
                  Financial figures represent ledger-verified balances deducted from passenger prepaid accounts. Ensure Stripe payouts are cleared inside the ledger portal.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
