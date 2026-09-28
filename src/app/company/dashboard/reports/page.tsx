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
  AlertCircle,
  Activity
} from "lucide-react";

interface RouteReport {
  routeId: string;
  revenue: number;
  trips: number;
}

interface DailyEarning {
  date: string;
  day: string;
  revenue: number;
}

export default function CompanyReportsPage() {
  const [routeData, setRouteData] = useState<RouteReport[]>([]);
  const [dailyData, setDailyData] = useState<DailyEarning[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Dynamic Real Date Filters (Default to past 7 days)
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    return d.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().slice(0, 10);
  });

  const fetchReports = async (start: string, end: string) => {
    try {
      setLoading(true);
      const [routeRes, dailyRes] = await Promise.all([
        apiClient.get("/company/reports/by-route"),
        apiClient.get("/company/reports/daily-trend", {
          params: { from: start, to: end },
        }),
      ]);

      if (routeRes.status === 200) {
        setRouteData(routeRes.data || []);
      }
      if (dailyRes.status === 200) {
        setDailyData(dailyRes.data || []);
      }
    } catch (err) {
      console.error("Failed to load operational audit reports", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports(startDate, endDate);
  }, [startDate, endDate]);

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

  // Real SVG chart coordinates calculations
  const totalPeriodRevenue = dailyData.reduce((acc, curr) => acc + curr.revenue, 0);
  const maxRevenueVal = Math.max(...dailyData.map((d) => d.revenue), 0);
  const chartCeiling = maxRevenueVal > 0 ? Math.ceil(maxRevenueVal * 1.25) : 1000;

  const getSvgPoints = () => {
    if (dailyData.length === 0) return { linePath: "", areaPath: "" };
    const width = 500;
    const height = 150;
    const step = dailyData.length > 1 ? width / (dailyData.length - 1) : width;

    const points = dailyData.map((item, idx) => {
      const x = Math.round(idx * step);
      const y = Math.round(height - (item.revenue / chartCeiling) * height);
      return { x, y };
    });

    const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x},${p.y}`).join(" ");
    const areaPath = `${linePath} L ${points[points.length - 1].x},${height} L 0,${height} Z`;

    return { linePath, areaPath };
  };

  const { linePath, areaPath } = getSvgPoints();

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
          disabled={exporting || loading}
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
          <div className="ml-auto text-xs text-muted font-mono">
            Period Total: <span className="font-bold text-emerald-500">LKR {totalPeriodRevenue.toFixed(2)}</span>
          </div>
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
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-base font-bold tracking-tight">Daily Financial Trend</h3>
                  <p className="text-[11px] text-muted mt-0.5">Live fare balances collected across completed shifts.</p>
                </div>
                <div className="text-right">
                  <span className="text-[9px] font-bold text-muted uppercase tracking-wider block">Peak Daily</span>
                  <span className="text-xs font-black text-indigo-500">LKR {maxRevenueVal.toFixed(2)}</span>
                </div>
              </div>

              {dailyData.length === 0 ? (
                <div className="surface-variant py-12 flex flex-col items-center justify-center text-center px-4 rounded-xl border border-[var(--color-outline-variant)]">
                  <Activity className="h-8 w-8 text-muted opacity-30 mb-3" />
                  <p className="text-xs font-bold text-muted">No transaction logs in selected date range</p>
                </div>
              ) : (
                /* Custom SVG Line Area Chart with Real Aggregates */
                <div className="h-56 relative pt-4">
                  {/* SVG Graph Grid lines */}
                  <div className="absolute inset-0 flex flex-col justify-between pointer-events-none text-[8px] font-mono text-muted pl-16 pb-6 border-b border-l border-[var(--color-outline-variant)]">
                    <div className="w-full text-right border-t border-[var(--color-outline-variant)]/30 pt-1">
                      LKR {chartCeiling.toLocaleString()}
                    </div>
                    <div className="w-full text-right border-t border-[var(--color-outline-variant)]/30 pt-1">
                      LKR {Math.round(chartCeiling * 0.66).toLocaleString()}
                    </div>
                    <div className="w-full text-right border-t border-[var(--color-outline-variant)]/30 pt-1">
                      LKR {Math.round(chartCeiling * 0.33).toLocaleString()}
                    </div>
                    <div className="w-full text-right pt-1">LKR 0</div>
                  </div>

                  {/* SVG Canvas */}
                  <div className="w-full h-full pl-16 pb-6 relative z-10">
                    <svg className="w-full h-full" viewBox="0 0 500 150" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
                          <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                        </linearGradient>
                      </defs>

                      {/* Area path */}
                      {areaPath && (
                        <path d={areaPath} fill="url(#areaGradient)" />
                      )}

                      {/* Line path */}
                      {linePath && (
                        <path
                          d={linePath}
                          fill="none"
                          stroke="#6366f1"
                          strokeWidth="2.5"
                        />
                      )}
                    </svg>

                    {/* Bottom Real Day labels */}
                    <div className="absolute bottom-0 left-16 right-0 flex justify-between text-[9px] font-bold text-muted pt-2 select-none overflow-hidden">
                      {dailyData.map((d, index) => (
                        <span key={index} className="truncate px-0.5">{d.day}</span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
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
                  <p className="text-xs font-bold text-muted">No route metrics logged yet</p>
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
