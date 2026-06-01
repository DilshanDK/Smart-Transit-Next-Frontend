"use client";

import React, { useEffect, useState } from "react";
import { apiClient } from "@/core/lib/api-client";
import {
  Bus,
  Calendar,
  Navigation,
  MapPin,
  Clock,
  Compass,
  ArrowRight,
  Search,
  Filter,
  CheckCircle,
  HelpCircle,
  XCircle,
  FileText
} from "lucide-react";
import Cookies from "js-cookie";

interface Journey {
  _id: string;
  routeId: string;
  startTimestamp: string;
  endTimestamp?: string;
  distanceKm?: number;
  fareCalculated?: { $numberDecimal?: string } | any;
  status: "IN_PROGRESS" | "COMPLETED" | "FAILED";
  startLocation: { coordinates: [number, number] };
  endLocation?: { coordinates: [number, number] };
  calculationMethod: string;
}

export default function JourneysPage() {
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchRoute, setSearchRoute] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedJourney, setSelectedJourney] = useState<Journey | null>(null);

  const fetchJourneys = async () => {
    try {
      setLoading(true);
      const token = Cookies.get("transit_token");
      if (!token) return;

      const res = await apiClient.get("/journey/passenger/history");
      if (res.status === 200) {
        setJourneys(res.data);
        if (res.data.length > 0) {
          setSelectedJourney(res.data[0]); // Default to first journey
        }
      }
    } catch (err) {
      console.error("Failed to fetch journeys", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJourneys();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            <CheckCircle className="h-3 w-3" />
            Completed
          </span>
        );
      case "IN_PROGRESS":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-500 border border-blue-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-ping" />
            In Transit
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/10 text-red-500 border border-red-500/20">
            <XCircle className="h-3 w-3" />
            Failed
          </span>
        );
    }
  };

  // Filter logic
  const filteredJourneys = journeys.filter((j) => {
    const matchesSearch = j.routeId.toLowerCase().includes(searchRoute.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || j.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getFormattedDuration = (start: string, end?: string) => {
    if (!end) return "Active now";
    const durationMs = new Date(end).getTime() - new Date(start).getTime();
    const minutes = Math.floor(durationMs / 60000);
    if (minutes < 1) return "Less than a minute";
    if (minutes < 60) return `${minutes} mins`;
    const hours = Math.floor(minutes / 60);
    const remainingMins = minutes % 60;
    return `${hours} hr ${remainingMins} mins`;
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Journey History</h2>
        <p className="text-sm text-muted mt-1">Review your recent boarding transactions and route records.</p>
      </div>

      {/* Main Grid */}
      <div className="grid gap-8 lg:grid-cols-12">
        {/* Left Side: Journeys List - 7 cols */}
        <div className="lg:col-span-7 space-y-4">
          {/* Filters Bar */}
          <div className="card p-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
              <input
                type="text"
                placeholder="Search Route ID (e.g. 138)..."
                value={searchRoute}
                onChange={(e) => setSearchRoute(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-[var(--color-outline-variant)] bg-[var(--color-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-[var(--color-on-surface)]"
              />
            </div>

            <div className="flex gap-2 items-center w-full sm:w-auto justify-end">
              <Filter className="h-3.5 w-3.5 text-muted" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs py-2 pl-3 pr-8 rounded-xl border border-[var(--color-outline-variant)] bg-[var(--color-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-[var(--color-on-surface)] cursor-pointer"
              >
                <option value="ALL">All Journeys</option>
                <option value="COMPLETED">Completed</option>
                <option value="IN_PROGRESS">Active</option>
                <option value="FAILED">Failed</option>
              </select>
            </div>
          </div>

          {/* List Wrapper */}
          <div className="space-y-3">
            {loading ? (
              <div className="card p-8 flex justify-center items-center">
                <div className="h-6 w-6 rounded-full border-2 border-[var(--color-primary)] border-t-transparent animate-spin" />
              </div>
            ) : filteredJourneys.length === 0 ? (
              <div className="card p-12 text-center flex flex-col items-center justify-center">
                <Bus className="h-10 w-10 text-muted opacity-40 mb-3" />
                <p className="text-sm font-semibold">No journeys found</p>
                <p className="text-xs text-muted mt-1">Try modifying your search or filter values.</p>
              </div>
            ) : (
              filteredJourneys.map((journey) => {
                const isSelected = selectedJourney?._id === journey._id;
                const fareStr = journey.fareCalculated?.$numberDecimal || journey.fareCalculated?.toString() || "0.00";
                const fare = parseFloat(fareStr);
                const date = new Date(journey.startTimestamp).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric"
                });
                const time = new Date(journey.startTimestamp).toLocaleTimeString(undefined, {
                  hour: "2-digit",
                  minute: "2-digit"
                });

                return (
                  <div
                    key={journey._id}
                    onClick={() => setSelectedJourney(journey)}
                    className={`card p-5 cursor-pointer transition-all hover:scale-[1.01] flex items-center justify-between border ${
                      isSelected
                        ? "border-[var(--color-primary)] bg-[var(--color-primary)] bg-opacity-[0.02]"
                        : "border-[var(--color-outline-variant)]"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                        isSelected 
                          ? "bg-[var(--color-primary)] bg-opacity-10 text-[var(--color-primary)]" 
                          : "bg-[var(--color-surface-variant)] text-muted"
                      }`}>
                        <Bus className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-extrabold text-[var(--color-on-surface)]">
                            Route {journey.routeId}
                          </h4>
                          {getStatusBadge(journey.status)}
                        </div>
                        <p className="text-xs text-muted mt-1 flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" />
                          {date} at {time}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      {journey.status === "COMPLETED" && (
                        <p className="text-sm font-extrabold text-[var(--color-on-surface)]">
                          LKR {fare.toFixed(2)}
                        </p>
                      )}
                      <p className="text-xs text-muted mt-1">
                        {journey.distanceKm ? `${journey.distanceKm.toFixed(1)} km` : "--"}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Detailed View - 5 cols */}
        <div className="lg:col-span-5">
          {selectedJourney ? (
            <div className="card p-6 md:p-8 space-y-6 sticky top-6">
              <div>
                <span className="text-[10px] font-bold text-muted uppercase tracking-widest block">Journey Audit Record</span>
                <h3 className="text-base font-extrabold tracking-tight mt-1 flex items-center gap-2">
                  <Compass className="h-4.5 w-4.5 text-[var(--color-primary)] animate-spin-slow" />
                  Route {selectedJourney.routeId} Details
                </h3>
              </div>

              {/* Decorative SVG Route Track Map */}
              <div className="relative h-44 rounded-xl border border-[var(--color-outline-variant)] bg-[var(--color-surface-variant)] overflow-hidden flex flex-col justify-center px-6 select-none">
                <div className="absolute inset-0 bg-radial-gradient opacity-[0.05] pointer-events-none" />
                
                {/* SVG Connecting Vector Line */}
                <svg className="absolute inset-x-0 top-1/2 -translate-y-1/2 w-full h-8 px-8" viewBox="0 0 100 20" preserveAspectRatio="none">
                  <path
                    d="M 0 10 Q 25 2, 50 10 T 100 10"
                    fill="none"
                    stroke="var(--color-primary)"
                    strokeWidth="1.5"
                    strokeDasharray="4 3"
                    className="animate-dash"
                  />
                </svg>

                <div className="flex justify-between items-center relative z-10 w-full">
                  {/* Start Point Pin */}
                  <div className="flex flex-col items-center gap-1 shrink-0">
                    <div className="h-8 w-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
                      <MapPin className="h-4 w-4" />
                    </div>
                    <span className="text-[9px] font-bold text-muted">Tap On</span>
                    <span className="text-[8px] font-mono text-muted bg-[var(--color-surface)] px-1 rounded border border-[var(--color-outline-variant)]">
                      {selectedJourney.startLocation?.coordinates 
                        ? `${selectedJourney.startLocation.coordinates[1].toFixed(4)}, ${selectedJourney.startLocation.coordinates[0].toFixed(4)}` 
                        : "0.0, 0.0"
                      }
                    </span>
                  </div>

                  {/* Distance Banner */}
                  <div className="flex flex-col items-center shrink-0">
                    <div className="bg-[var(--color-surface)] px-3 py-1.5 rounded-full border border-[var(--color-outline-variant)] flex flex-col items-center shadow-sm">
                      <span className="text-xs font-extrabold text-[var(--color-on-surface)]">
                        {selectedJourney.distanceKm ? `${selectedJourney.distanceKm.toFixed(2)} km` : "In Transit"}
                      </span>
                    </div>
                  </div>

                  {/* End Point Pin */}
                  <div className="flex flex-col items-center gap-1 shrink-0">
                    <div className={`h-8 w-8 rounded-full border flex items-center justify-center ${
                      selectedJourney.status === "COMPLETED" 
                        ? "bg-red-500/10 border-red-500/20 text-red-500" 
                        : "bg-neutral-500/10 border-neutral-500/20 text-muted"
                    }`}>
                      {selectedJourney.status === "COMPLETED" ? <MapPin className="h-4 w-4" /> : <HelpCircle className="h-4 w-4" />}
                    </div>
                    <span className="text-[9px] font-bold text-muted">Tap Off</span>
                    <span className="text-[8px] font-mono text-muted bg-[var(--color-surface)] px-1 rounded border border-[var(--color-outline-variant)]">
                      {selectedJourney.endLocation?.coordinates 
                        ? `${selectedJourney.endLocation.coordinates[1].toFixed(4)}, ${selectedJourney.endLocation.coordinates[0].toFixed(4)}` 
                        : "Pending..."
                      }
                    </span>
                  </div>
                </div>
              </div>

              {/* Journey Specifications List */}
              <div className="space-y-4 pt-2">
                <div className="flex justify-between items-center py-2.5 border-b border-[var(--color-outline-variant)]">
                  <span className="text-xs font-bold text-muted flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-[var(--color-primary)]" />
                    Trip Duration
                  </span>
                  <span className="text-xs font-bold text-[var(--color-on-surface)]">
                    {getFormattedDuration(selectedJourney.startTimestamp, selectedJourney.endTimestamp)}
                  </span>
                </div>

                <div className="flex justify-between items-center py-2.5 border-b border-[var(--color-outline-variant)]">
                  <span className="text-xs font-bold text-muted flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-[var(--color-primary)]" />
                    Boarding Time
                  </span>
                  <span className="text-xs font-bold text-[var(--color-on-surface)]">
                    {new Date(selectedJourney.startTimestamp).toLocaleTimeString()}
                  </span>
                </div>

                {selectedJourney.endTimestamp && (
                  <div className="flex justify-between items-center py-2.5 border-b border-[var(--color-outline-variant)]">
                    <span className="text-xs font-bold text-muted flex items-center gap-1.5">
                      <Calendar className="h-4 w-4 text-[var(--color-primary)]" />
                      Termination Time
                    </span>
                    <span className="text-xs font-bold text-[var(--color-on-surface)]">
                      {new Date(selectedJourney.endTimestamp).toLocaleTimeString()}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center py-2.5 border-b border-[var(--color-outline-variant)]">
                  <span className="text-xs font-bold text-muted flex items-center gap-1.5">
                    <Navigation className="h-4 w-4 text-[var(--color-primary)]" />
                    Calculation System
                  </span>
                  <span className="text-[10px] font-extrabold uppercase tracking-wide bg-[var(--color-surface-variant)] px-2.5 py-0.5 rounded text-muted border border-[var(--color-outline-variant)]">
                    {selectedJourney.calculationMethod === "GOOGLE_MAPS" ? "Google Maps API" : "GPS Coordinates Fallback"}
                  </span>
                </div>

                {/* Fare breakdown card */}
                {selectedJourney.status === "COMPLETED" && (
                  <div className="p-4 rounded-xl bg-gradient-to-r from-[var(--color-primary)]/5 to-emerald-500/5 border border-[var(--color-primary)]/10 space-y-2.5 mt-2">
                    <span className="text-[10px] font-bold text-muted uppercase tracking-widest block">Transit Fare Breakdown</span>
                    <div className="flex justify-between text-xs text-muted">
                      <span>Base Flag Fall Fare</span>
                      <span>LKR 50.00</span>
                    </div>
                    <div className="flex justify-between text-xs text-muted pb-2.5 border-b border-[var(--color-outline-variant)]">
                      <span>Distance Rate (LKR 10.00/km)</span>
                      <span>LKR {((selectedJourney.distanceKm || 0) * 10).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-extrabold text-[var(--color-on-surface)] pt-1">
                      <span>Total Debit Amount</span>
                      <span className="text-[var(--color-primary)]">
                        LKR {parseFloat(selectedJourney.fareCalculated?.$numberDecimal || selectedJourney.fareCalculated?.toString() || "0.00").toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="card p-12 text-center flex flex-col items-center justify-center sticky top-6">
              <FileText className="h-10 w-10 text-muted opacity-30 mb-3" />
              <p className="text-sm font-semibold">Select a Journey</p>
              <p className="text-xs text-muted mt-1">Click on any journey card in the log list to inspect details.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
