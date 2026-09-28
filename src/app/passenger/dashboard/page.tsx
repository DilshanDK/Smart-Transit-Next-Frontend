'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/core/context/AuthContext';
import { apiClient } from '@/core/lib/api-client';
import { Wallet, History, ArrowRight, TrendingUp, Bus, ArrowUpRight, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import Cookies from 'js-cookie';

interface Journey {
  _id: string;
  routeId: string;
  startTimestamp: string;
  endTimestamp?: string;
  distanceKm?: number;
  fareCalculated?: any;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
}

export default function PassengerDashboardOverview() {
  const { user, refreshProfile } = useAuth();
  const [activeJourney, setActiveJourney] = useState<Journey | null>(null);
  const [recentJourneys, setRecentJourneys] = useState<Journey[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      const token = Cookies.get('transit_token');
      if (!token) {
        setLoadingData(false);
        return;
      }

      try {
        const success = await refreshProfile(); // reload wallet balance
        if (!success) {
          setLoadingData(false);
          return;
        }

        const [activeRes, historyRes] = await Promise.all([
          apiClient.get('/journey/active'),
          apiClient.get('/journey/passenger/history'),
        ]);

        if (activeRes.status === 200) {
          setActiveJourney(activeRes.data);
        }

        if (historyRes.status === 200) {
          // slice the first 5 journeys
          setRecentJourneys(historyRes.data.slice(0, 5));
        }
      } catch (error: any) {
        if (error.response?.status !== 401) {
          console.error('Failed to load dashboard data:', error);
        }
      } finally {
        setLoadingData(false);
      }
    };

    fetchDashboardData();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-500 border border-blue-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-ping" />
            In Transit
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            Completed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/10 text-red-500 border border-red-500/20">
            Deduction Failed
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Greetings */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          {getGreeting()}, {user?.fullName.split(' ')[0]}!
        </h2>
        <p className="text-sm text-muted mt-1">Here is a quick summary of your transit status.</p>
      </div>

      {/* Active Journey Warning Banner */}
      {activeJourney && (
        <div className="p-5 surface border border-[var(--color-primary)] border-opacity-35 bg-[var(--color-primary)] bg-opacity-[0.03] rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-xl bg-[var(--color-primary)] bg-opacity-10 flex items-center justify-center shrink-0 mt-0.5">
              <Bus className="h-5 w-5 text-[var(--color-primary)]" />
            </div>
            <div>
              <h4 className="text-sm font-bold">Active Journey In Progress</h4>
              <p className="text-xs text-muted mt-0.5">
                Checked in on {activeJourney.routeId}. Please remember to tap off at your destination stop to complete the fare deduction.
              </p>
            </div>
          </div>
          <Link
            href="/passenger/dashboard/journeys"
            className="btn-outline text-xs py-2 px-4 rounded-xl inline-flex items-center gap-1 hover:gap-1.5 transition-all text-center self-start sm:self-center"
          >
            Track Status
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      )}

      {/* Top Cards Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Wallet Balance Card */}
        <div className="p-6 md:p-8 rounded-2xl bg-gradient-to-br from-[var(--color-primary)] to-[#009b35] text-white shadow-lg relative overflow-hidden flex flex-col justify-between h-48 md:h-56">
          {/* Abstract Wave */}
          <div className="absolute right-[-10%] top-[-10%] w-[60%] h-[70%] bg-white/5 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-lg bg-white/15 flex items-center justify-center">
                <Wallet className="h-4.5 w-4.5" />
              </div>
              <span className="text-sm font-semibold tracking-wide bg-white/10 px-2.5 py-0.5 rounded-full">
                Prepaid Transit Wallet
              </span>
            </div>
            <Link
              href="/passenger/dashboard/wallet"
              className="h-8 w-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-all"
            >
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="my-2 relative z-10">
            <p className="text-xs text-white text-opacity-80 uppercase tracking-widest font-bold">Available Balance</p>
            <p className="text-3xl md:text-4xl font-extrabold tracking-tight mt-1">
              LKR {user?.walletBalance !== undefined ? parseFloat(String((user as any).walletBalance?.$numberDecimal ?? (user as any).walletBalance ?? 0)).toFixed(2) : '0.00'}
            </p>
          </div>

          <div className="relative z-10 flex gap-3">
            <Link
              href="/passenger/dashboard/wallet"
              className="flex-1 text-center py-2.5 bg-white text-[var(--color-primary)] text-sm font-bold rounded-xl hover:bg-opacity-95 transition-all shadow-sm"
            >
              Add Money
            </Link>
          </div>
        </div>

        {/* Quick Insights Card */}
        <div className="card p-6 md:p-8 flex flex-col justify-between h-48 md:h-56">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-[var(--color-primary)]" />
              Usage Summary
            </h3>
          </div>
          
          <div className="grid grid-cols-2 gap-4 my-2">
            <div className="surface-variant p-4">
              <p className="text-xs text-muted font-semibold uppercase tracking-wider">Completed Trips</p>
              <p className="text-2xl font-bold mt-1 text-[var(--color-on-surface)]">
                {recentJourneys.filter((j) => j.status === 'COMPLETED').length}
              </p>
            </div>
            <div className="surface-variant p-4">
              <p className="text-xs text-muted font-semibold uppercase tracking-wider">Recent Expense</p>
              <p className="text-2xl font-bold mt-1 text-[var(--color-on-surface)]">
                LKR{' '}
                {recentJourneys
                  .filter((j) => j.status === 'COMPLETED')
                  .reduce((acc, j) => acc + parseFloat(j.fareCalculated?.$numberDecimal || j.fareCalculated?.toString() || '0'), 0)
                  .toFixed(2)}
              </p>
            </div>
          </div>
          
          <p className="text-xs text-muted">
            Statistics calculated from your recent 5 transactions.
          </p>
        </div>
      </div>

      {/* Recent Trips Table/List */}
      <div className="card p-6 md:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold tracking-tight">Recent Journey Log</h3>
            <p className="text-xs text-muted mt-0.5">Your most recent boarding taps</p>
          </div>
          <Link
            href="/passenger/dashboard/journeys"
            className="text-xs text-[var(--color-primary)] font-bold flex items-center gap-1 hover:underline"
          >
            All Journeys
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {loadingData ? (
          <div className="py-8 flex justify-center">
            <div className="h-6 w-6 rounded-full border-2 border-[var(--color-primary)] border-t-transparent animate-spin" />
          </div>
        ) : recentJourneys.length === 0 ? (
          <div className="surface-variant py-10 flex flex-col items-center justify-center text-center px-4">
            <History className="h-10 w-10 text-muted opacity-40 mb-3" />
            <p className="text-sm font-semibold">No transactions or journeys found</p>
            <p className="text-xs text-muted mt-1 max-w-[280px]">
              Taps made using your mobile passenger QR or NFC badge will show up here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--color-outline-variant)]">
            {recentJourneys.map((journey) => {
              const date = new Date(journey.startTimestamp).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              });
              const time = new Date(journey.startTimestamp).toLocaleTimeString(undefined, {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div key={journey._id} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-[var(--color-surface-variant)] flex items-center justify-center">
                      <Bus className="h-4.5 w-4.5 text-muted" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">{journey.routeId}</p>
                      <p className="text-xs text-muted mt-0.5">
                        {date} at {time}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(journey.status)}
                    {journey.fareCalculated && (
                      <span className="text-sm font-extrabold text-[var(--color-on-surface)]">
                        - LKR {parseFloat(journey.fareCalculated?.$numberDecimal || journey.fareCalculated.toString()).toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
