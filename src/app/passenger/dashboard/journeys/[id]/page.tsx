"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiClient } from "@/core/lib/api-client";
import {
  ArrowLeft,
  Bus,
  CheckCircle,
  XCircle,
  Clock,
  Navigation,
  MapPin,
  Receipt,
  Banknote,
  Ruler,
  Timer,
  Settings2,
  TrendingUp,
} from "lucide-react";
import Cookies from "js-cookie";

interface Journey {
  _id: string;
  routeId: string;
  startTimestamp: string;
  endTimestamp?: string;
  distanceKm?: number;
  fareCalculated?: { $numberDecimal?: string } | any;
  status: "IN_TRANSIT" | "COMPLETED" | "FAILED";
  startLocation: { coordinates: [number, number] };
  endLocation?: { coordinates: [number, number] };
  calculationMethod: string;
  busRegistration?: string;
}

function parseFare(raw: any): number {
  if (!raw) return 0;
  if (typeof raw === "number") return raw;
  if (typeof raw === "object" && raw.$numberDecimal) return parseFloat(raw.$numberDecimal);
  return parseFloat(String(raw)) || 0;
}

function formatDate(ts?: string): string {
  if (!ts) return "N/A";
  return new Date(ts).toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(start?: string, end?: string): string {
  if (!start || !end) return "—";
  const ms = new Date(end).getTime() - new Date(start).getTime();
  if (ms < 0) return "—";
  const mins = Math.floor(ms / 60000);
  const secs = Math.floor((ms % 60000) / 1000);
  if (mins >= 60) {
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  }
  return `${mins}m ${secs}s`;
}

export default function JourneyDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();

  const [journey, setJourney] = useState<Journey | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchJourney = async () => {
      try {
        setLoading(true);
        const token = Cookies.get("transit_token");
        if (!token) { router.push("/passenger/login"); return; }

        // Fetch all and find by ID (backend doesn't expose single-journey endpoint yet)
        const res = await apiClient.get("/journey/passenger/history");
        if (res.status === 200) {
          const found = res.data.find((j: Journey) => j._id === id);
          if (found) setJourney(found);
          else setError("Journey not found.");
        }
      } catch {
        setError("Failed to load journey details.");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchJourney();
  }, [id, router]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="h-8 w-8 rounded-full border-2 border-[var(--color-primary)] border-t-transparent animate-spin" />
        <p className="text-sm text-muted">Loading journey details…</p>
      </div>
    );
  }

  if (error || !journey) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
        <XCircle className="h-10 w-10 text-red-400 opacity-60" />
        <p className="text-sm font-bold text-muted">{error || "Journey not found."}</p>
        <button onClick={() => router.back()} className="btn-primary px-4 py-2 text-xs rounded-xl">Go Back</button>
      </div>
    );
  }

  const fare = parseFare(journey.fareCalculated);
  const baseFare = 30;
  const distanceFare = Math.max(0, fare - baseFare);
  const distanceKm = journey.distanceKm ?? 0;
  const isCompleted = journey.status === "COMPLETED";
  const isInTransit = journey.status === "IN_TRANSIT";

  const statusConfig = {
    COMPLETED: { color: "text-emerald-500", bg: "bg-emerald-500/10 border-emerald-500/20", icon: <CheckCircle className="h-4 w-4" />, label: "Completed" },
    IN_TRANSIT: { color: "text-blue-500", bg: "bg-blue-500/10 border-blue-500/20", icon: <span className="h-2 w-2 rounded-full bg-blue-500 animate-ping inline-block" />, label: "In Transit" },
    FAILED: { color: "text-red-500", bg: "bg-red-500/10 border-red-500/20", icon: <XCircle className="h-4 w-4" />, label: "Failed" },
  }[journey.status];

  const startLng = journey.startLocation?.coordinates?.[0];
  const startLat = journey.startLocation?.coordinates?.[1];
  const endLng = journey.endLocation?.coordinates?.[0];
  const endLat = journey.endLocation?.coordinates?.[1];

  // Build an OpenStreetMap static-style embed URL if we have both coords
  const hasMap = startLat && startLng;

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      {/* ── Back + Header ────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="h-9 w-9 rounded-xl border border-[var(--color-outline-variant)] flex items-center justify-center hover:bg-[var(--color-surface-variant)] transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h2 className="text-lg font-bold tracking-tight">Journey Detail</h2>
          <p className="text-[11px] text-muted font-mono">#{journey._id.slice(-8).toUpperCase()}</p>
        </div>
        <div className="ml-auto">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${statusConfig.bg} ${statusConfig.color}`}>
            {statusConfig.icon}
            {statusConfig.label}
          </span>
        </div>
      </div>

      {/* ── Main Grid ───────────────────────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-3">

        {/* ── Left: Fare Hero + Breakdown ─────────────────────────────── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Fare Hero Card */}
          <div className="card p-6 bg-gradient-to-br from-[var(--color-primary)]/5 to-transparent">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-sm font-bold">
                <Bus className="h-4 w-4 text-[var(--color-primary)]" />
                Route {journey.routeId}
                {journey.busRegistration && (
                  <span className="text-[11px] text-muted font-normal">· {journey.busRegistration}</span>
                )}
              </div>
              <Receipt className="h-4 w-4 text-muted" />
            </div>
            <p className="text-[11px] text-muted uppercase tracking-widest font-bold mb-1">Total Fare</p>
            <p className="text-4xl font-extrabold tracking-tight">LKR {fare.toFixed(2)}</p>
            <p className="text-xs text-muted mt-1">Deducted from prepaid wallet</p>
          </div>

          {/* Fare Breakdown */}
          <div className="card p-6 space-y-1">
            <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
              <Banknote className="h-4 w-4 text-[var(--color-primary)]" />
              Fare Breakdown
            </h3>
            <FareRow icon={<TrendingUp className="h-3.5 w-3.5" />} label="Base Fare" value={`LKR ${baseFare.toFixed(2)}`} />
            <FareRow icon={<Ruler className="h-3.5 w-3.5" />} label="Distance Travelled" value={`${distanceKm.toFixed(2)} km`} />
            <FareRow icon={<Banknote className="h-3.5 w-3.5" />} label="Distance Charge" value={`LKR ${distanceFare.toFixed(2)}`} />
            <FareRow icon={<Settings2 className="h-3.5 w-3.5" />} label="Calculation Method" value={journey.calculationMethod || "N/A"} />
            <div className="border-t border-[var(--color-outline-variant)] mt-3 pt-3">
              <FareRow icon={<Receipt className="h-3.5 w-3.5" />} label="Total Charged" value={`LKR ${fare.toFixed(2)}`} highlight />
            </div>
          </div>

          {/* Map Preview (OSM embed if start coords exist) */}
          {hasMap && (
            <div className="card overflow-hidden">
              <div className="p-4 border-b border-[var(--color-outline-variant)] flex items-center gap-2">
                <Navigation className="h-4 w-4 text-[var(--color-primary)]" />
                <h3 className="text-sm font-bold">Route Map Preview</h3>
              </div>
              <div className="relative h-52 bg-[var(--color-surface-variant)]">
                <iframe
                  title="Journey map"
                  className="w-full h-full"
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${startLng - 0.03}%2C${startLat - 0.03}%2C${(endLng ?? startLng) + 0.03}%2C${(endLat ?? startLat) + 0.03}&layer=hot&marker=${startLat}%2C${startLng}`}
                  style={{ border: 0, pointerEvents: "none" }}
                />
                <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-[var(--color-surface)]/30 to-transparent" />
              </div>
            </div>
          )}
        </div>

        {/* ── Right: Timeline + Location ─────────────────────────────── */}
        <div className="space-y-5">
          {/* Timeline */}
          <div className="card p-5 space-y-1">
            <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
              <Clock className="h-4 w-4 text-[var(--color-primary)]" />
              Timeline
            </h3>
            <div className="relative pl-6">
              {/* Vertical line */}
              <div className="absolute left-[9px] top-3 bottom-3 w-0.5 bg-[var(--color-outline-variant)]" />

              <TimelineRow
                dot="bg-emerald-500"
                label="Tap-On"
                value={formatDate(journey.startTimestamp)}
              />
              <TimelineRow
                dot={isCompleted ? "bg-red-400" : "bg-[var(--color-outline-variant)]"}
                label="Tap-Off"
                value={formatDate(journey.endTimestamp)}
              />
            </div>
            <div className="mt-3 pt-3 border-t border-[var(--color-outline-variant)] flex items-center gap-2 text-xs text-muted">
              <Timer className="h-3.5 w-3.5" />
              Duration: <span className="font-bold text-[var(--color-on-surface)]">
                {formatDuration(journey.startTimestamp, journey.endTimestamp)}
              </span>
            </div>
          </div>

          {/* Location Coordinates */}
          <div className="card p-5 space-y-3">
            <h3 className="text-sm font-bold mb-2 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-[var(--color-primary)]" />
              Coordinates
            </h3>
            <CoordRow
              label="Boarding"
              lat={startLat}
              lng={startLng}
              color="text-emerald-500"
            />
            <CoordRow
              label="Exit"
              lat={endLat}
              lng={endLng}
              color="text-red-400"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FareRow({ icon, label, value, highlight = false }: { icon: React.ReactNode; label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`flex items-center justify-between py-2.5 text-xs ${highlight ? "font-bold" : ""}`}>
      <span className="flex items-center gap-2 text-muted">
        <span className="text-[var(--color-primary)]">{icon}</span>
        {label}
      </span>
      <span className={highlight ? "text-[var(--color-primary)] text-sm" : "font-medium"}>{value}</span>
    </div>
  );
}

function TimelineRow({ dot, label, value }: { dot: string; label: string; value: string }) {
  return (
    <div className="relative mb-5 last:mb-0">
      <div className={`absolute left-[-15px] top-1 h-3 w-3 rounded-full border-2 border-[var(--color-surface)] ${dot}`} />
      <p className="text-[10px] text-muted uppercase tracking-wider font-bold">{label}</p>
      <p className="text-xs font-medium mt-0.5">{value}</p>
    </div>
  );
}

function CoordRow({ label, lat, lng, color }: { label: string; lat?: number; lng?: number; color: string }) {
  return (
    <div className="p-3 rounded-xl bg-[var(--color-surface-variant)] space-y-0.5">
      <p className={`text-[10px] font-bold uppercase tracking-wider ${color}`}>{label}</p>
      {lat && lng ? (
        <p className="text-[11px] font-mono text-[var(--color-on-surface)]">
          {lat.toFixed(5)}, {lng.toFixed(5)}
        </p>
      ) : (
        <p className="text-[11px] text-muted">Not recorded</p>
      )}
    </div>
  );
}
