"use client";

import React, { useEffect, useState, useRef, useMemo } from "react";
import { apiClient, getApiBaseUrl } from "@/core/lib/api-client";
import { io, Socket } from "socket.io-client";
import Cookies from "js-cookie";
import {
  GoogleMap,
  useJsApiLoader,
  Polyline,
  Marker,
  OverlayView,
} from "@react-google-maps/api";
import {
  Compass,
  MapPin,
  Clock,
  Loader2,
  AlertCircle,
  Bus,
  Radio,
  Navigation,
  Gauge,
  Zap,
  Activity,
  ArrowRight,
  Maximize2,
  Minimize2,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  CheckCircle2,
} from "lucide-react";

interface RouteStop {
  name: string;
  distanceFromStart: number; // in km
  location: {
    type: "Point";
    coordinates: [number, number]; // [lng, lat]
  };
}

interface TransitRoute {
  _id?: string;
  routeId: string;
  routeName: string;
  startTerminal: string;
  endTerminal: string;
  baseFare: number;
  ratePerKm: number;
  stops: RouteStop[];
  path: {
    type: "LineString";
    coordinates: [number, number][]; // [[lng, lat]]
  };
}

interface LiveBus {
  driverId: string;
  busNumber: string;
  routeId: string;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  status: string;
  direction?: string;
  origin?: string;
  destination?: string;
  updatedAt: string;
}

// Haversine formula to compute distance between two coords in km
function getLatLngDistance(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function PassengerTrackingPage() {
  const [routes, setRoutes] = useState<TransitRoute[]>([]);
  const [activeRouteIndex, setActiveRouteIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Google Maps JS API loader
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
  });

  const [mapRef, setMapRef] = useState<google.maps.Map | null>(null);

  // Live Telemetry state
  const [liveBuses, setLiveBuses] = useState<LiveBus[]>([]);
  const [telemetryConnected, setTelemetryConnected] = useState(false);
  const [isLockedOnBus, setIsLockedOnBus] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  // Track previous bus latitude to infer direction from real GPS movement
  const prevBusLatRef = useRef<number | null>(null);
  const [inferredIsToKandy, setInferredIsToKandy] = useState<boolean | null>(null);

  // Fullscreen event listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen().catch((err) => {
        console.error("Error enabling fullscreen", err);
      });
    } else {
      document.exitFullscreen();
    }
  };

  // Fetch all active transit routes
  const fetchRoutes = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await apiClient.get("/routes");
      if (res.status === 200 && Array.isArray(res.data)) {
        setRoutes(res.data);
        if (res.data.length > 0) {
          setActiveRouteIndex(0);
        }
      }
    } catch (err: any) {
      console.error("Failed to load routes", err);
      setErrorMsg("Failed to connect to backend transit service.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoutes();
  }, []);

  const activeRoute = routes[activeRouteIndex] || null;

  // Polyline points
  const drawPath = useMemo(() => {
    if (!activeRoute || !activeRoute.path || !activeRoute.path.coordinates) return [];
    return activeRoute.path.coordinates.map((c) => ({ lat: c[1], lng: c[0] }));
  }, [activeRoute]);

  // Stops
  const drawStops = useMemo(() => {
    if (!activeRoute || !activeRoute.stops) return [];
    return activeRoute.stops;
  }, [activeRoute]);

  // Memoized centroid to prevent map snapping back on re-renders
  const mapCenter = useMemo(() => {
    if (drawPath.length > 0) {
      const midIdx = Math.floor(drawPath.length / 2);
      return drawPath[midIdx];
    }
    return { lat: 7.3786, lng: 80.6186 }; // Default center (Akurana / Route 593 midpoint)
  }, [drawPath]);

  // Socket.io telemetry connection for live bus updates
  useEffect(() => {
    if (!activeRoute?.routeId) return;

    const token = Cookies.get("transit_token");
    const baseUrl = getApiBaseUrl();

    const socket: Socket = io(`${baseUrl}/tracking`, {
      transports: ["websocket"],
      auth: { token: token || "" },
    });

    socket.on("connect", () => {
      setTelemetryConnected(true);
      socket.emit("join_route", { routeId: activeRoute.routeId });
    });

    socket.on("disconnect", () => {
      setTelemetryConnected(false);
    });

    socket.on("connect_error", () => {
      setTelemetryConnected(false);
    });

    socket.on("bus_moved", (payload: LiveBus) => {
      if (payload && payload.routeId === activeRoute.routeId) {
        // Infer direction from GPS latitude movement when no explicit 'direction' field is present.
        // Route 593: Kandy (7.29°N) to Matale (7.47°N) — latitude increases going Northbound.
        // Decreasing latitude = bus moving South = heading Towards Kandy.
        // Increasing latitude = bus moving North = heading Towards Matale.
        if (!payload.direction) {
          const prevLat = prevBusLatRef.current;
          if (prevLat !== null && Math.abs(payload.latitude - prevLat) > 0.00005) {
            setInferredIsToKandy(payload.latitude < prevLat);
          }
        }
        prevBusLatRef.current = payload.latitude;

        setLiveBuses((prev) => {
          const idx = prev.findIndex((b) => b.driverId === payload.driverId);
          if (idx >= 0) {
            const updated = [...prev];
            updated[idx] = payload;
            return updated;
          }
          return [...prev, payload];
        });
      }
    });

    // Fetch initial live buses via REST
    apiClient
      .get("/tracking/live", { params: { routeId: activeRoute.routeId } })
      .then((res) => {
        if (res.status === 200 && Array.isArray(res.data)) {
          const mapped: LiveBus[] = res.data
            .filter((item: any) => item.status !== "OFFLINE")
            .map((item: any) => ({
              driverId: item.driverId?.toString() || item._id,
              busNumber: item.busNumber || "Active Bus",
              routeId: item.routeId,
              latitude: item.currentLocation?.coordinates?.[1] || 0,
              longitude: item.currentLocation?.coordinates?.[0] || 0,
              speed: item.speed || 0,
              heading: item.heading || 0,
              status: item.status || "ACTIVE",
              updatedAt: item.lastUpdated || new Date().toISOString(),
            }));
          setLiveBuses(mapped);
        }
      })
      .catch(() => {});

    return () => {
      socket.disconnect();
    };
  }, [activeRoute?.routeId]);

  // Precalculate cumulative distances along polyline
  const routePathMetrics = useMemo(() => {
    if (!activeRoute?.path?.coordinates || activeRoute.path.coordinates.length < 2) {
      return null;
    }
    const coords = activeRoute.path.coordinates;
    const cumDist: number[] = [0];
    for (let i = 1; i < coords.length; i++) {
      const [pLng, pLat] = coords[i - 1];
      const [cLng, cLat] = coords[i];
      cumDist.push(cumDist[i - 1] + getLatLngDistance(pLat, pLng, cLat, cLng));
    }
    return {
      coords,
      cumDist,
      totalLength: cumDist[cumDist.length - 1],
    };
  }, [activeRoute?.path?.coordinates]);

  // Primary active bus for ETA calculation
  const primaryBus = liveBuses.length > 0 ? liveBuses[0] : null;

  // Detect bus direction and progress along route
  const busRouteInfo = useMemo(() => {
    if (!primaryBus) return null;

    // 1. Determine direction with a 3-tier priority system:
    //    Priority 1: Explicit direction field (from mock simulation or future backend support)
    //    Priority 2: Inferred from lat movement history (real GPS — decreasing lat = heading South towards Kandy)
    //    Priority 3: Fallback to unknown direction (no movement detected yet)
    let isToKandy: boolean;
    if (primaryBus.direction) {
      // Mock / future backend: explicit direction string
      isToKandy = primaryBus.direction.toUpperCase().includes("KANDY");
    } else if (inferredIsToKandy !== null) {
      // Real GPS: use lat-movement inferred direction
      isToKandy = inferredIsToKandy;
    } else {
      // Final fallback: no movement detected yet — assume Towards Matale (northbound)
      isToKandy = false;
    }

    // 2. Find closest vertex on the polyline path to find current km along route (0km at Kandy to ~25.7km at Matale)
    let busKm = 0;
    if (routePathMetrics && routePathMetrics.coords.length > 0) {
      let minD = Infinity;
      let bestIdx = 0;
      const bLat = primaryBus.latitude;
      const bLng = primaryBus.longitude;

      for (let i = 0; i < routePathMetrics.coords.length; i++) {
        const [cLng, cLat] = routePathMetrics.coords[i];
        const dLat = cLat - bLat;
        const dLng = cLng - bLng;
        const dSq = dLat * dLat + dLng * dLng;
        if (dSq < minD) {
          minD = dSq;
          bestIdx = i;
        }
      }
      busKm = routePathMetrics.cumDist[bestIdx];
    } else {
      busKm = 0;
    }

    const directionLabel = isToKandy ? "Towards Kandy" : "Towards Matale";
    const destinationName = isToKandy ? "Kandy" : "Matale";
    const originName = isToKandy ? "Matale" : "Kandy";

    return {
      isToKandy,
      busKm,
      directionLabel,
      destinationName,
      originName,
    };
  }, [primaryBus, routePathMetrics]);

  // Stops dynamically ordered in the direction of travel (Matale -> Kandy or Kandy -> Matale)
  const orderedStops = useMemo(() => {
    if (!drawStops || drawStops.length === 0) return [];
    if (busRouteInfo?.isToKandy) {
      return [...drawStops].reverse();
    }
    return drawStops;
  }, [drawStops, busRouteInfo?.isToKandy]);

  // Lock camera to bus when active
  useEffect(() => {
    if (isLockedOnBus && mapRef && primaryBus) {
      mapRef.panTo({ lat: primaryBus.latitude, lng: primaryBus.longitude });
    }
  }, [primaryBus?.latitude, primaryBus?.longitude, isLockedOnBus, mapRef]);

  // Unlock camera if user manually drags/pans map
  const handleMapDragStart = () => {
    setIsLockedOnBus(false);
  };

  // Calculate live ETA or passed status for each stop based on current bus location, direction & speed
  const calculateStopETA = (stop: RouteStop, bus: LiveBus | null) => {
    if (!bus || !busRouteInfo) return null;

    const stopLat = stop.location.coordinates[1];
    const stopLng = stop.location.coordinates[0];
    const directDistKm = getLatLngDistance(bus.latitude, bus.longitude, stopLat, stopLng);

    // 1. If currently within stop proximity (350 meters)
    if (directDistKm < 0.35) {
      return {
        status: "At Stop",
        distKm: directDistKm.toFixed(1),
        text: "At Stop",
        clockTime: "Now",
        isPast: false,
      };
    }

    const busSpeed = bus.speed > 15 ? bus.speed : 35; // Default 35 km/h urban speed
    const isToKandy = busRouteInfo.isToKandy;
    const busKm = busRouteInfo.busKm;
    const stopKm = stop.distanceFromStart;

    // 2. Determine if stop is PASSED or UPCOMING based on direction of travel
    let isPassed = false;
    let distDelta = 0;

    if (isToKandy) {
      // Traveling from Matale (~25.7 km) down to Kandy (0.0 km)
      // Stops with distanceFromStart > busKm + 0.35 are in the past (already passed)!
      if (stopKm > busKm + 0.35) {
        isPassed = true;
        distDelta = Math.max(directDistKm, stopKm - busKm);
      } else {
        isPassed = false;
        distDelta = Math.max(directDistKm, busKm - stopKm);
      }
    } else {
      // Traveling from Kandy (0.0 km) up to Matale (~25.7 km)
      // Stops with distanceFromStart < busKm - 0.35 are in the past (already passed)!
      if (stopKm < busKm - 0.35) {
        isPassed = true;
        distDelta = Math.max(directDistKm, busKm - stopKm);
      } else {
        isPassed = false;
        distDelta = Math.max(directDistKm, stopKm - busKm);
      }
    }

    if (isPassed) {
      const minsAgo = Math.max(1, Math.round((distDelta / busSpeed) * 60));
      const passedTime = new Date(Date.now() - minsAgo * 60000);
      const clockTime = passedTime.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });

      return {
        status: "Passed",
        distKm: distDelta.toFixed(1),
        text: `Passed ~${minsAgo}m ago`,
        clockTime: `Passed at ${clockTime}`,
        isPast: true,
      };
    }

    // Stop is approaching in front of the bus
    const mins = Math.max(1, Math.round((distDelta / busSpeed) * 60));
    const arrivalDate = new Date(Date.now() + mins * 60000);
    const clockTime = arrivalDate.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    return {
      status: "Approaching",
      distKm: distDelta.toFixed(1),
      text: `${mins} min${mins > 1 ? "s" : ""}`,
      clockTime,
      isPast: false,
    };
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--color-outline-variant)] pb-5">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold tracking-tight text-[var(--color-on-surface)] flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-md shadow-emerald-500/20">
                <Compass className="h-5 w-5" />
              </span>
              Live Bus Tracking
            </h1>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              {telemetryConnected ? "Satellite Live" : "Telemetry Connecting..."}
            </div>
          </div>
          <p className="text-sm text-muted">
            Track real-time bus locations, approaching speeds, and estimated stop arrival times.
          </p>
        </div>

        {/* Route Selector Chips */}
        {routes.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium text-muted mr-1">Corridor:</span>
            {routes.map((r, idx) => (
              <button
                key={r.routeId}
                onClick={() => {
                  setActiveRouteIndex(idx);
                  setIsLockedOnBus(true);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeRouteIndex === idx
                    ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/25 scale-102"
                    : "bg-[var(--color-surface)] text-muted hover:text-[var(--color-on-surface)] border border-[var(--color-outline-variant)]"
                }`}
              >
                <Bus className="h-3.5 w-3.5" />
                <span>Route {r.routeId}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <div className="h-96 rounded-2xl border border-[var(--color-outline-variant)] bg-[var(--color-surface)] flex flex-col items-center justify-center gap-3">
          <Loader2 className="h-8 w-8 text-emerald-500 animate-spin" />
          <span className="text-sm font-medium text-muted">Connecting to satellite transit feed...</span>
        </div>
      ) : errorMsg ? (
        <div className="p-6 rounded-2xl border border-red-500/20 bg-red-500/5 text-center flex flex-col items-center gap-3">
          <AlertCircle className="h-8 w-8 text-red-400" />
          <p className="text-sm text-red-400">{errorMsg}</p>
          <button
            onClick={fetchRoutes}
            className="px-4 py-2 rounded-xl bg-red-500 text-white text-xs font-bold hover:bg-red-600 transition flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Retry
          </button>
        </div>
      ) : !activeRoute ? (
        <div className="p-12 text-center rounded-2xl border border-[var(--color-outline-variant)] bg-[var(--color-surface)]">
          <Bus className="h-10 w-10 text-muted mx-auto mb-3 opacity-40" />
          <h3 className="text-base font-semibold text-[var(--color-on-surface)]">No Transit Routes Configured</h3>
          <p className="text-xs text-muted mt-1">Routes will appear once company schedules are activated.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Map Column (8 Cols) */}
          <div className="lg:col-span-8 space-y-4">
            {/* Active Route Header Card */}
            <div className="p-4 rounded-2xl border border-[var(--color-outline-variant)] bg-[var(--color-surface)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
                  <Bus className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-base text-[var(--color-on-surface)]">
                      Route {activeRoute.routeId}: {activeRoute.routeName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted mt-0.5">
                    <span>{activeRoute.startTerminal}</span>
                    <ArrowRight className="h-3 w-3 text-emerald-500" />
                    <span>{activeRoute.endTerminal}</span>
                    <span>•</span>
                    <span>{drawStops.length} Verified Stops</span>
                  </div>
                </div>
              </div>

              {/* Status pill */}
              <div className="flex items-center gap-2">
                <div className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                  liveBuses.length > 0
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                    : "bg-amber-500/10 border-amber-500/30 text-amber-400"
                }`}>
                  <span className={`h-2 w-2 rounded-full ${liveBuses.length > 0 ? "bg-emerald-400 animate-ping" : "bg-amber-400"}`} />
                  {liveBuses.length > 0 ? `${liveBuses.length} Bus Active on Line` : "Awaiting Bus Departure"}
                </div>
              </div>
            </div>

            {/* Google Map Container */}
            <div
              ref={containerRef}
              className={`relative border border-[var(--color-outline-variant)] overflow-hidden bg-[#0c0c12] transition-all duration-300 ${
                isFullscreen ? "w-screen h-screen rounded-none fixed inset-0 z-50" : "h-[500px] rounded-2xl"
              }`}
            >
              {!isLoaded ? (
                <div className="h-full w-full flex flex-col items-center justify-center gap-2">
                  {loadError ? (
                    <div className="text-red-400 text-xs flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" /> Failed to load Google Maps script. Check key.
                    </div>
                  ) : (
                    <>
                      <Loader2 className="h-6 w-6 text-emerald-500 animate-spin" />
                      <span className="text-[10px] text-muted">Loading Satellite Transit Map...</span>
                    </>
                  )}
                </div>
              ) : (
                <>
                  <GoogleMap
                    mapContainerClassName="w-full h-full"
                    center={mapCenter}
                    zoom={12}
                    onLoad={(map) => setMapRef(map)}
                    onDragStart={handleMapDragStart}
                    options={{
                      disableDoubleClickZoom: true,
                      fullscreenControl: false,
                      styles: [
                        { elementType: "geometry", stylers: [{ color: "#1e2430" }] },
                        { elementType: "labels.text.stroke", stylers: [{ color: "#1a202c" }] },
                        { elementType: "labels.text.fill", stylers: [{ color: "#a0aec0" }] },
                        {
                          featureType: "administrative.locality",
                          elementType: "labels.text.fill",
                          stylers: [{ color: "#cbd5e1" }],
                        },
                        {
                          featureType: "poi",
                          elementType: "labels.text.fill",
                          stylers: [{ color: "#94a3b8" }],
                        },
                        {
                          featureType: "road",
                          elementType: "geometry",
                          stylers: [{ color: "#2d3748" }],
                        },
                        {
                          featureType: "road",
                          elementType: "geometry.stroke",
                          stylers: [{ color: "#1a202c" }],
                        },
                        {
                          featureType: "road",
                          elementType: "labels.text.fill",
                          stylers: [{ color: "#cbd5e0" }],
                        },
                        {
                          featureType: "transit",
                          elementType: "geometry",
                          stylers: [{ color: "#243042" }],
                        },
                        {
                          featureType: "water",
                          elementType: "geometry",
                          stylers: [{ color: "#0f172a" }],
                        },
                      ],
                    }}
                  >
                    {/* Road Polyline (Blue route path) */}
                    {drawPath.length > 1 && (
                      <Polyline
                        path={drawPath}
                        options={{
                          strokeColor: "#3b82f6",
                          strokeOpacity: 0.95,
                          strokeWeight: 4.5,
                          geodesic: true,
                        }}
                      />
                    )}

                    {/* Transit Stop Markers */}
                    {drawStops.map((stop, idx) => (
                      <Marker
                        key={`stop-${idx}`}
                        position={{
                          lat: stop.location.coordinates[1],
                          lng: stop.location.coordinates[0],
                        }}
                        label={{
                          text: stop.name,
                          color: "#ffffff",
                          fontSize: "10px",
                          fontWeight: "bold",
                        }}
                      />
                    ))}

                    {/* Live Moving Bus Marker — Uber-style animated */}
                    {liveBuses.map((bus, bIdx) => (
                      <OverlayView
                        key={`bus-${bus.driverId || bIdx}`}
                        position={{ lat: bus.latitude, lng: bus.longitude }}
                        mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                        getPixelPositionOffset={(w, h) => ({ x: -w / 2, y: -h / 2 })}
                      >
                        <div
                          title={`Bus ${bus.busNumber} • ${Math.round(bus.speed)} km/h`}
                          style={{
                            position: "relative",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            cursor: "pointer",
                            userSelect: "none",
                          }}
                        >
                          {/* Pulsing outer ripple rings */}
                          <span
                            style={{
                              position: "absolute",
                              top: "50%",
                              left: "50%",
                              transform: "translate(-50%, -50%)",
                              width: 72,
                              height: 72,
                              borderRadius: "50%",
                              background: "rgba(34,197,94,0.18)",
                              animation: "busPulse 2s ease-out infinite",
                              pointerEvents: "none",
                            }}
                          />
                          <span
                            style={{
                              position: "absolute",
                              top: "50%",
                              left: "50%",
                              transform: "translate(-50%, -50%)",
                              width: 48,
                              height: 48,
                              borderRadius: "50%",
                              background: "rgba(34,197,94,0.28)",
                              animation: "busPulse 2s ease-out 0.4s infinite",
                              pointerEvents: "none",
                            }}
                          />

                          {/* Rotating Directional Arrow */}
                          <div
                            style={{
                              position: "absolute",
                              top: -10,
                              left: "50%",
                              transform: `translateX(-50%) rotate(${bus.heading}deg)`,
                              transformOrigin: "50% 28px",
                              transition: "transform 1.2s ease",
                              pointerEvents: "none",
                            }}
                          >
                            <svg width="12" height="16" viewBox="0 0 12 16">
                              <polygon
                                points="6,0 12,14 6,10 0,14"
                                fill="#22c55e"
                                stroke="white"
                                strokeWidth="1.5"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </div>

                          {/* Bus Badge Icon */}
                          <div
                            style={{
                              position: "relative",
                              zIndex: 10,
                              width: 38,
                              height: 38,
                              borderRadius: "50%",
                              background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                              border: "2.5px solid #ffffff",
                              boxShadow: "0 4px 14px rgba(16, 185, 129, 0.5)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "#ffffff",
                            }}
                          >
                            <Bus style={{ width: 18, height: 18 }} />
                          </div>

                          {/* Floating Speed & Label Tag */}
                          <div
                            style={{
                              marginTop: 4,
                              background: "rgba(12, 12, 18, 0.85)",
                              backdropFilter: "blur(6px)",
                              border: "1px solid rgba(255,255,255,0.15)",
                              borderRadius: 8,
                              padding: "2px 6px",
                              fontSize: 10,
                              fontWeight: 700,
                              color: "#ffffff",
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                              whiteSpace: "nowrap",
                              boxShadow: "0 2px 8px rgba(0,0,0,0.5)",
                            }}
                          >
                            <span style={{ color: "#4ade80" }}>{bus.busNumber}</span>
                            <span style={{ color: "rgba(255,255,255,0.4)" }}>•</span>
                            <span>{Math.round(bus.speed)} km/h</span>
                          </div>
                        </div>
                      </OverlayView>
                    ))}
                  </GoogleMap>

                  {/* Floating Action Controls on Map (Bottom Right) */}
                  <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-2">
                    {primaryBus && (
                      <button
                        onClick={() => {
                          const target = !isLockedOnBus;
                          setIsLockedOnBus(target);
                          if (target && mapRef) {
                            mapRef.panTo({ lat: primaryBus.latitude, lng: primaryBus.longitude });
                          }
                        }}
                        className={`p-3 rounded-xl shadow-lg border flex items-center justify-center transition-all duration-300 backdrop-blur-md cursor-pointer ${
                          isLockedOnBus
                            ? "bg-emerald-500 text-white border-emerald-400 hover:bg-emerald-600 shadow-emerald-500/25"
                            : "bg-[var(--color-surface)]/95 text-[var(--color-on-surface)] border-[var(--color-outline-variant)] hover:bg-[var(--color-surface-variant)]"
                        }`}
                        title={isLockedOnBus ? "Unlock camera from bus" : "Lock camera on moving bus"}
                      >
                        <Compass className={`h-4.5 w-4.5 ${isLockedOnBus ? "animate-spin-slow" : ""}`} />
                      </button>
                    )}

                    <button
                      onClick={() => {
                        if (mapRef && drawPath.length > 0) {
                          const bounds = new google.maps.LatLngBounds();
                          drawPath.forEach((pt) => bounds.extend(pt));
                          mapRef.fitBounds(bounds, { top: 30, right: 30, bottom: 30, left: 30 });
                        }
                      }}
                      className="p-3 rounded-xl bg-[var(--color-surface)]/95 text-[var(--color-on-surface)] border border-[var(--color-outline-variant)] hover:bg-[var(--color-surface-variant)] shadow-lg transition-all backdrop-blur-md cursor-pointer"
                      title="Fit entire route on map"
                    >
                      <Navigation className="h-4.5 w-4.5 rotate-45" />
                    </button>

                    <button
                      onClick={toggleFullscreen}
                      className="p-3 rounded-xl bg-[var(--color-surface)]/95 text-[var(--color-on-surface)] border border-[var(--color-outline-variant)] hover:bg-[var(--color-surface-variant)] shadow-lg transition-all backdrop-blur-md cursor-pointer"
                      title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                    >
                      {isFullscreen ? <Minimize2 className="h-4.5 w-4.5" /> : <Maximize2 className="h-4.5 w-4.5" />}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Sidebar Telemetry & Next-Stop Arrival Times (4 Cols) */}
          <div className="lg:col-span-4 space-y-4">
            {/* Active Bus Telemetry Card */}
            {primaryBus ? (
              <div className="p-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping" />
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-500">Live Active Vehicle</span>
                  </div>
                  <span className="text-[11px] font-mono text-muted">
                    {new Date(primaryBus.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-[var(--color-surface)] border border-[var(--color-outline-variant)]">
                    <span className="text-[10px] font-medium text-muted uppercase">Bus Plate</span>
                    <div className="text-base font-extrabold text-[var(--color-on-surface)] flex items-center gap-1.5 mt-0.5">
                      <Bus className="h-4 w-4 text-emerald-500" />
                      {primaryBus.busNumber}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-[var(--color-surface)] border border-[var(--color-outline-variant)]">
                    <span className="text-[10px] font-medium text-muted uppercase">Current Speed</span>
                    <div className="text-base font-extrabold text-[var(--color-on-surface)] flex items-center gap-1.5 mt-0.5">
                      <Gauge className="h-4 w-4 text-teal-400" />
                      {Math.round(primaryBus.speed)} km/h
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-5 rounded-2xl border border-dashed border-[var(--color-outline-variant)] bg-[var(--color-surface)] text-center space-y-2">
                <Bus className="h-7 w-7 text-muted mx-auto opacity-40" />
                <span className="text-xs font-bold text-[var(--color-on-surface)] block">No Driver Currently On Shift</span>
                <p className="text-[11px] text-muted">
                  When a driver begins their shift on Route {activeRoute.routeId}, their real-time telemetry will appear here.
                </p>
              </div>
            )}

            {/* Real-Time Next-Stop Arrival Times Timeline */}
            <div className="p-5 rounded-2xl border border-[var(--color-outline-variant)] bg-[var(--color-surface)] space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--color-outline-variant)] pb-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-emerald-500" />
                  <h3 className="text-sm font-bold text-[var(--color-on-surface)]">Next-Stop ETAs</h3>
                </div>
                <div className="flex items-center gap-2">
                  {busRouteInfo && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                      <Navigation className="h-3 w-3" />
                      {busRouteInfo.directionLabel}
                    </span>
                  )}
                  <span className="text-[11px] text-muted font-medium">Route {activeRoute.routeId}</span>
                </div>
              </div>

              <div
                className="space-y-3 max-h-[380px] overflow-y-auto pr-2 custom-scrollbar"
                style={{
                  colorScheme: "dark",
                }}
              >
                <style dangerouslySetInnerHTML={{ __html: `
                  .custom-scrollbar {
                    color-scheme: dark !important;
                  }
                  .custom-scrollbar::-webkit-scrollbar {
                    width: 6px !important;
                    height: 6px !important;
                  }
                  .custom-scrollbar::-webkit-scrollbar-track {
                    background: rgba(255, 255, 255, 0.03) !important;
                    border-radius: 9999px !important;
                  }
                  .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(16, 185, 129, 0.5) !important;
                    border-radius: 9999px !important;
                  }
                  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #10b981 !important;
                  }
                  .custom-scrollbar::-webkit-scrollbar-button,
                  .custom-scrollbar::-webkit-scrollbar-button:single-button,
                  .custom-scrollbar::-webkit-scrollbar-button:vertical:decrement,
                  .custom-scrollbar::-webkit-scrollbar-button:vertical:increment {
                    display: none !important;
                    width: 0 !important;
                    height: 0 !important;
                  }
                  .custom-scrollbar::-webkit-scrollbar-corner {
                    background: transparent !important;
                  }
                  @supports (-moz-appearance: none) {
                    .custom-scrollbar {
                      scrollbar-width: thin !important;
                      scrollbar-color: #10b981 rgba(255, 255, 255, 0.04) !important;
                    }
                  }
                `}} />
                {orderedStops.map((stop, idx) => {
                  const eta = calculateStopETA(stop, primaryBus);
                  const totalRouteLength =
                    routePathMetrics?.totalLength ||
                    (drawStops.length > 0
                      ? drawStops[drawStops.length - 1].distanceFromStart
                      : 25.7);
                  const displayKm = busRouteInfo?.isToKandy
                    ? Math.max(0, totalRouteLength - stop.distanceFromStart)
                    : stop.distanceFromStart;

                  return (
                    <div
                      key={`eta-stop-${stop.name}-${idx}`}
                      className={`p-3 rounded-xl border transition-all flex items-center justify-between ${
                        eta?.status === "At Stop"
                          ? "bg-emerald-500/10 border-emerald-500/40 shadow-sm shadow-emerald-500/10"
                          : eta?.isPast
                          ? "bg-[var(--color-bg)]/40 border-[var(--color-outline-variant)] opacity-70"
                          : "bg-[var(--color-bg)] border-[var(--color-outline-variant)] hover:border-emerald-500/30"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`h-7 w-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                            eta?.status === "At Stop"
                              ? "bg-emerald-500 text-white animate-pulse"
                              : eta?.isPast
                              ? "bg-slate-500/10 text-slate-400 border border-slate-500/20"
                              : "bg-emerald-500/10 text-emerald-500"
                          }`}
                        >
                          {eta?.isPast ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-500/70" />
                          ) : (
                            idx + 1
                          )}
                        </div>
                        <div>
                          <span
                            className={`text-xs font-bold block ${
                              eta?.isPast
                                ? "text-slate-400"
                                : "text-[var(--color-on-surface)]"
                            }`}
                          >
                            {stop.name}
                          </span>
                          <span className="text-[10px] text-muted">
                            {displayKm.toFixed(1)} km from start
                          </span>
                        </div>
                      </div>

                      {/* Live ETA / Passed Badge */}
                      {eta ? (
                        <div className="text-right">
                          <span
                            className={`text-xs font-extrabold block ${
                              eta.status === "At Stop"
                                ? "text-emerald-400 animate-pulse"
                                : eta.isPast
                                ? "text-slate-400"
                                : "text-emerald-500"
                            }`}
                          >
                            {eta.text}
                          </span>
                          <span className="text-[10px] text-muted font-medium">
                            {eta.isPast
                              ? `${eta.clockTime} (${eta.distKm} km behind)`
                              : `${eta.clockTime} (${eta.distKm} km away)`}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-muted italic">
                          Scheduled
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
