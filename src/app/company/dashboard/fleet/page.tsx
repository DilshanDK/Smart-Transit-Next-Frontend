"use client";

import React, { useEffect, useState } from "react";
import { apiClient } from "@/core/lib/api-client";
import {
  Bus,
  RefreshCw,
  Search,
  CheckCircle,
  Clock,
  Compass,
  AlertCircle,
  Users,
  Loader2,
  ExternalLink
} from "lucide-react";
import Link from "next/link";

interface FleetVehicle {
  busRegistration: string;
  driverName: string;
  driverId: string;
  lastActive: string;
}

export default function CompanyFleetPage() {
  const [vehicles, setVehicles] = useState<FleetVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchFleet = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get("/company/fleet");
      if (res.status === 200) {
        setVehicles(res.data);
      }
    } catch (err) {
      console.error("Failed to fetch fleet shift data", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchFleet();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchFleet();
  };

  const filteredVehicles = vehicles.filter((v) => {
    const term = searchQuery.toLowerCase();
    return (
      (v.busRegistration && v.busRegistration.toLowerCase().includes(term)) ||
      (v.driverName && v.driverName.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Upper Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[var(--color-on-surface)]">
            Active Fleet Monitor
          </h2>
          <p className="text-sm text-muted mt-1">
            Track vehicles currently on active shifts with their bound driver credentials.
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing || loading}
          className="self-start sm:self-auto flex items-center gap-2 py-2.5 px-4 rounded-xl border border-[var(--color-outline-variant)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-variant)] text-xs font-bold text-[var(--color-on-surface)] cursor-pointer transition-all disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
          Sync Live Fleet
        </button>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid gap-6 sm:grid-cols-3">
        <div className="card p-6 flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 shrink-0">
            <Bus className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-muted uppercase tracking-wider block">
              Active Vehicles On Road
            </span>
            <h3 className="text-xl font-black text-[var(--color-on-surface)] mt-0.5">
              {vehicles.length}
            </h3>
          </div>
        </div>

        <div className="card p-6 flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
            <CheckCircle className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-muted uppercase tracking-wider block">
              Telemetry Status
            </span>
            <h3 className="text-xl font-black text-[var(--color-on-surface)] mt-0.5">
              {vehicles.length > 0 ? "All Syncing" : "Offline"}
            </h3>
          </div>
        </div>

        <div className="card p-6 flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-500 shrink-0">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-muted uppercase tracking-wider block">
              Assigned Crew members
            </span>
            <h3 className="text-xl font-black text-[var(--color-on-surface)] mt-0.5">
              {vehicles.filter(v => v.driverName).length} Drivers
            </h3>
          </div>
        </div>
      </div>

      {/* Search and Table Grid */}
      <div className="card p-6 md:p-8 space-y-6">
        <div className="flex items-center gap-3 max-w-md w-full relative">
          <Search className="absolute left-3.5 h-4 w-4 text-muted pointer-events-none" />
          <input
            type="text"
            placeholder="Search active fleet by registration plate or driver..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--color-outline-variant)] bg-[var(--color-surface-variant)] text-xs text-[var(--color-on-surface)] focus:outline-none focus:border-indigo-500 transition-all placeholder:text-muted"
          />
        </div>

        {loading ? (
          <div className="py-20 flex justify-center">
            <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
          </div>
        ) : filteredVehicles.length === 0 ? (
          <div className="surface-variant py-20 flex flex-col items-center justify-center text-center px-4 rounded-2xl border border-[var(--color-outline-variant)]">
            <Compass className="h-10 w-10 text-muted opacity-30 mb-4" />
            <p className="text-sm font-bold text-muted">No active vehicles on routes</p>
            <p className="text-xs text-muted mt-1 max-w-sm leading-relaxed">
              When a driver starts a shift bound to a registration plate in the mobile app, it will register here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--color-outline-variant)] text-[10px] font-bold text-muted uppercase tracking-wider">
                  <th className="pb-3 pl-2">Registration Plate</th>
                  <th className="pb-3">Assigned On-Shift Driver</th>
                  <th className="pb-3">Connection Telemetry</th>
                  <th className="pb-3">Last Ping Sync</th>
                  <th className="pb-3 text-right pr-2">Tracking</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-outline-variant)]">
                {filteredVehicles.map((vehicle, idx) => {
                  const lastActiveTime = new Date(vehicle.lastActive).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit"
                  });

                  return (
                    <tr key={idx} className="text-xs hover:bg-[var(--color-surface-variant)]/40 transition-colors">
                      <td className="py-4 pl-2 font-mono font-bold text-[var(--color-on-surface)]">
                        <div className="flex items-center gap-2.5">
                          <div className="h-7 w-7 rounded bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-bold">
                            <Bus className="h-4 w-4" />
                          </div>
                          <span>{vehicle.busRegistration}</span>
                        </div>
                      </td>
                      <td className="py-4 text-[var(--color-on-surface)] font-medium">
                        {vehicle.driverName}
                      </td>
                      <td className="py-4">
                        <span className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                          Streaming GPS
                        </span>
                      </td>
                      <td className="py-4 font-mono text-muted text-[11px]">
                        {lastActiveTime}
                      </td>
                      <td className="py-4 text-right pr-2">
                        <button
                          onClick={() => {
                            alert(`Showing live Google Maps view for vehicle ${vehicle.busRegistration}`);
                          }}
                          className="inline-flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-600 font-bold transition-colors cursor-pointer"
                        >
                          Locate Live
                          <ExternalLink className="h-3 w-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="p-4 rounded-xl border border-indigo-500/10 bg-indigo-500/5 flex gap-3">
        <AlertCircle className="h-5 w-5 text-indigo-500 shrink-0 mt-0.5" />
        <div className="text-[11px] text-muted leading-relaxed">
          <span className="font-bold text-[var(--color-on-surface)]">Active Telemetry Note:</span> Fleet tracking is automatically bound when drivers verify their shifts using the smart transit driver app. Live coordinates are aggregated by the NestJS Socket.io gateway and cached via Redis to keep updates fast.
        </div>
      </div>
    </div>
  );
}
