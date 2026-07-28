"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { io, Socket } from "socket.io-client";

// ─── Types ───────────────────────────────────────────────────────────────────
interface BusLocation {
  driverId: string;
  busNumber: string;
  routeId: string;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  isActive: boolean;
}

interface BusMarkerState {
  current: { lat: number; lng: number };
  heading: number;
  busNumber: string;
  lastUpdate: number;
}

// ─── Smooth Lerp animation helper ────────────────────────────────────────────
function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

// ─── Heading to rotation CSS ─────────────────────────────────────────────────
function headingToRotation(heading: number): string {
  return `rotate(${heading}deg)`;
}

// ─── Convert lat/lng to pixel position on flat-map ──────────────────────────
// We'll use a simplified Mercator projection for the visible map bounds
function latLngToPercent(
  lat: number,
  lng: number,
  bounds: { north: number; south: number; east: number; west: number }
) {
  const x = ((lng - bounds.west) / (bounds.east - bounds.west)) * 100;
  const y = ((bounds.north - lat) / (bounds.north - bounds.south)) * 100;
  return { x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) };
}

export default function PublicLiveTrackingPage() {
  const params = useParams();
  const routeId = params?.routeId as string;

  const [buses, setBuses] = useState<Map<string, BusMarkerState>>(new Map());
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "disconnected">("connecting");
  const [activeBusCount, setActiveBusCount] = useState(0);
  const [lastUpdateTime, setLastUpdateTime] = useState<string | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const busTargetsRef = useRef<Map<string, { lat: number; lng: number; heading: number }>>(new Map());
  const animFrameRef = useRef<number | null>(null);

  // Colombo city area bounds for our tile overlay
  const mapBounds = {
    north: 7.05,
    south: 6.80,
    east: 79.95,
    west: 79.75,
  };

  // Smooth animation loop
  const animateBuses = useCallback(() => {
    setBuses((prev) => {
      const next = new Map(prev);
      let changed = false;

      busTargetsRef.current.forEach((target, driverId) => {
        const existing = next.get(driverId);
        if (!existing) return;

        const newLat = lerp(existing.current.lat, target.lat, 0.08);
        const newLng = lerp(existing.current.lng, target.lng, 0.08);

        const latDiff = Math.abs(newLat - existing.current.lat);
        const lngDiff = Math.abs(newLng - existing.current.lng);

        if (latDiff > 0.000001 || lngDiff > 0.000001) {
          next.set(driverId, {
            ...existing,
            current: { lat: newLat, lng: newLng },
            heading: target.heading,
          });
          changed = true;
        }
      });

      return changed ? next : prev;
    });

    animFrameRef.current = requestAnimationFrame(animateBuses);
  }, []);

  useEffect(() => {
    if (!routeId) return;

    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
    const socket: Socket = io(`${apiBase}/tracking`, {
      transports: ["websocket"],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setConnectionStatus("connected");
      socket.emit("join_route", { routeId });
    });

    socket.on("disconnect", () => {
      setConnectionStatus("disconnected");
    });

    socket.on("connect_error", () => {
      setConnectionStatus("disconnected");
    });

    socket.on("bus_moved", (data: BusLocation) => {
      const { driverId, latitude, longitude, heading, busNumber, isActive } = data;

      if (!isActive) {
        setBuses((prev) => {
          const next = new Map(prev);
          next.delete(driverId);
          busTargetsRef.current.delete(driverId);
          return next;
        });
        return;
      }

      // Update target for smooth animation
      busTargetsRef.current.set(driverId, { lat: latitude, lng: longitude, heading });

      setBuses((prev) => {
        const next = new Map(prev);
        if (!next.has(driverId)) {
          // First appearance — snap to position immediately
          next.set(driverId, {
            current: { lat: latitude, lng: longitude },
            heading,
            busNumber: busNumber || `Bus`,
            lastUpdate: Date.now(),
          });
        } else {
          next.set(driverId, {
            ...next.get(driverId)!,
            busNumber: busNumber || `Bus`,
            lastUpdate: Date.now(),
          });
        }
        return next;
      });

      setActiveBusCount((c) => c);
      setLastUpdateTime(new Date().toLocaleTimeString());
    });

    // Start animation loop
    animFrameRef.current = requestAnimationFrame(animateBuses);

    return () => {
      socket.disconnect();
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [routeId, animateBuses]);

  // Track active bus count
  useEffect(() => {
    setActiveBusCount(buses.size);
  }, [buses]);

  const busArray = Array.from(buses.entries());

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col font-sans">
      {/* ─── Header ──────────────────────────────────────────────────────── */}
      <header className="relative z-10 px-6 py-4 border-b border-white/5 flex items-center justify-between bg-[#0d0d14]/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
            <svg className="h-4 w-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </div>
          <div>
            <h1 className="text-sm font-bold text-white">Live Fleet Tracking</h1>
            <p className="text-[10px] text-white/40">Route {routeId}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Connection status pill */}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold transition-colors ${
            connectionStatus === "connected"
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              : connectionStatus === "connecting"
              ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
              : "bg-red-500/10 text-red-400 border border-red-500/20"
          }`}>
            <span className={`h-1.5 w-1.5 rounded-full ${
              connectionStatus === "connected" ? "bg-emerald-400 animate-pulse" :
              connectionStatus === "connecting" ? "bg-amber-400 animate-pulse" :
              "bg-red-400"
            }`} />
            {connectionStatus === "connected" ? "Live" : connectionStatus === "connecting" ? "Connecting…" : "Disconnected"}
          </div>

          {/* Bus count badge */}
          <div className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[11px] font-bold text-white/60">
            {activeBusCount} Active {activeBusCount === 1 ? "Bus" : "Buses"}
          </div>
        </div>
      </header>

      {/* ─── Main Map Area ─────────────────────────────────────────────────── */}
      <div className="flex-1 relative overflow-hidden">
        {/* Dark CartoDB-styled background map using iframe (no API key needed) */}
        <iframe
          src={`https://www.openstreetmap.org/export/embed.html?bbox=${mapBounds.west}%2C${mapBounds.south}%2C${mapBounds.east}%2C${mapBounds.north}&layer=hot`}
          className="absolute inset-0 w-full h-full opacity-30 pointer-events-none"
          style={{ filter: "invert(1) hue-rotate(180deg) saturate(0.8) brightness(0.7)" }}
          title="Map background"
        />

        {/* Dark overlay for readability */}
        <div className="absolute inset-0 bg-[#0a0a0f]/40 pointer-events-none" />

        {/* ── Bus Markers (absolutely positioned via lat/lng → %) ─────────── */}
        <div className="absolute inset-0">
          {busArray.length === 0 && connectionStatus === "connected" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-center">
              <div className="h-16 w-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                <svg className="h-8 w-8 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold text-white/50">No buses on route</p>
                <p className="text-[11px] text-white/25 mt-1">Waiting for drivers to start their shift on Route {routeId}</p>
              </div>
            </div>
          )}

          {connectionStatus === "connecting" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
              <div className="h-10 w-10 rounded-full border-2 border-emerald-500/40 border-t-emerald-400 animate-spin" />
              <p className="text-sm font-bold text-white/40">Connecting to live feed…</p>
            </div>
          )}

          {busArray.map(([driverId, bus]) => {
            const { x, y } = latLngToPercent(bus.current.lat, bus.current.lng, mapBounds);
            return (
              <div
                key={driverId}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none"
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                  transition: "left 0.3s linear, top 0.3s linear",
                }}
              >
                {/* Label above marker */}
                <div className="flex flex-col items-center gap-1">
                  <div className="bg-black/80 backdrop-blur-sm border border-emerald-500/30 text-white text-[9px] font-bold px-2 py-0.5 rounded-md whitespace-nowrap shadow-lg">
                    {bus.busNumber}
                  </div>
                  {/* Bus icon with heading rotation */}
                  <div
                    className="h-8 w-8 rounded-full bg-emerald-500 flex items-center justify-center shadow-xl shadow-emerald-500/30 border-2 border-white/30"
                    style={{ transform: headingToRotation(bus.heading) }}
                  >
                    <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17 20H7v1a1 1 0 01-2 0v-1H4a2 2 0 01-2-2V6a2 2 0 012-2h16a2 2 0 012 2v12a2 2 0 01-2 2h-1v1a1 1 0 01-2 0v-1zM4 6v8h16V6H4zm2 9a1 1 0 110 2 1 1 0 010-2zm12 0a1 1 0 110 2 1 1 0 010-2z" />
                    </svg>
                  </div>
                  {/* Speed indicator */}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Bottom Stats Bar ────────────────────────────────────────────── */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#0a0a0f] to-transparent pt-12 pb-4 px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-md bg-emerald-500/20 flex items-center justify-center">
                <svg className="h-3.5 w-3.5 text-emerald-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17 20H7v1a1 1 0 01-2 0v-1H4a2 2 0 01-2-2V6a2 2 0 012-2h16a2 2 0 012 2v12a2 2 0 01-2 2h-1v1a1 1 0 01-2 0v-1z" />
                </svg>
              </div>
              <span className="text-[11px] text-white/50 font-medium">Smart Transit — Public Tracker</span>
            </div>
            {lastUpdateTime && (
              <span className="text-[10px] text-white/30 font-mono">Last update: {lastUpdateTime}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
