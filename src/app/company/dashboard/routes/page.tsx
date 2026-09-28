"use client";

import React, { useEffect, useState, useRef, Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
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
  Plus,
  Trash2,
  DollarSign,
  Route,
  ChevronRight,
  Info,
  Clock,
  Loader2,
  AlertCircle,
  Map,
  CheckCircle,
  Bus,
  Radio,
  Navigation,
  Gauge,
  Zap,
  Activity,
  ArrowRight,
  Maximize2,
  Minimize2,
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

// Haversine formula to compute distance between two coords
function getLatLngDistance(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371; // Radius of earth in km
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

function CompanyRoutesContent() {
  const searchParams = useSearchParams();
  const routeIdParam = searchParams?.get("routeId");

  const [routes, setRoutes] = useState<TransitRoute[]>([]);
  const [activeRouteIndex, setActiveRouteIndex] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // New Route Form State
  const [newRouteId, setNewRouteId] = useState("");
  const [newRouteName, setNewRouteName] = useState("");
  const [newStart, setNewStart] = useState("");
  const [newEnd, setNewEnd] = useState("");
  const [newBase, setNewBase] = useState("50");
  const [newRate, setNewRate] = useState("10");

  // Google Maps state
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
  });

  const [editMode, setEditMode] = useState(false);
  const [drawPath, setDrawPath] = useState<{ lat: number; lng: number }[]>([]);
  const [drawStops, setDrawStops] = useState<RouteStop[]>([]);
  const [mapRef, setMapRef] = useState<google.maps.Map | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Live Telemetry state
  const [liveBuses, setLiveBuses] = useState<LiveBus[]>([]);
  const [telemetryConnected, setTelemetryConnected] = useState(false);
  const [isLockedOnBus, setIsLockedOnBus] = useState(true); // Default to locked on bus
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  // Track previous bus latitude to infer direction from real GPS movement
  const prevBusLatRef = useRef<number | null>(null);
  const [inferredIsToKandy, setInferredIsToKandy] = useState<boolean | null>(null);

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

  const fetchRoutes = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get("/routes");
      if (res.status === 200) {
        setRoutes(res.data);
        if (res.data.length > 0) {
          if (routeIdParam) {
            const idx = res.data.findIndex((r: any) => r.routeId === routeIdParam);
            if (idx >= 0) {
              setActiveRouteIndex(idx);
              setLoading(false);
              return;
            }
          }
          setActiveRouteIndex(0);
        }
      }
    } catch (err) {
      console.error("Failed to load routes", err);
      setErrorMsg("Failed to load routes from backend API");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoutes();
  }, []);

  const activeRoute = routes[activeRouteIndex];

  // Set up drawing coordinates when active route changes or edit mode toggles
  useEffect(() => {
    if (activeRoute) {
      const coords =
        activeRoute.path?.coordinates.map(([lng, lat]) => ({
          lat,
          lng,
        })) || [];
      setDrawPath(coords);
      setDrawStops(activeRoute.stops || []);
    } else {
      setDrawPath([]);
      setDrawStops([]);
    }
    setEditMode(false);
  }, [activeRouteIndex, activeRoute]);

  // Fit bounds whenever map or drawPath updates
  useEffect(() => {
    if (mapRef && drawPath.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      drawPath.forEach((pt) => bounds.extend(pt));
      mapRef.fitBounds(bounds, { top: 30, right: 30, bottom: 30, left: 30 });
    }
  }, [mapRef, drawPath]);

  // Real-Time WebSocket Telemetry Subscription
  useEffect(() => {
    if (!activeRoute?.routeId) return;

    const token = Cookies.get("transit_token");
    const socketUrl = `${getApiBaseUrl()}/tracking`;

    const socket: Socket = io(socketUrl, {
      transports: ["websocket"],
      auth: { token },
    });

    socket.on("connect", () => {
      setTelemetryConnected(true);
      socket.emit("join_route", { routeId: activeRoute.routeId });
    });

    socket.on("disconnect", () => {
      setTelemetryConnected(false);
    });

    socket.on("bus_moved", (payload: LiveBus) => {
      if (payload.routeId === activeRoute.routeId) {
        // Infer direction from GPS latitude movement when no explicit 'direction' field is present.
        // Route 593: Kandy (7.29°N) to Matale (7.47°N) — latitude increases going Northbound.
        // Decreasing latitude = bus moving South = heading Towards Kandy.
        // Increasing latitude = bus moving North = heading Towards Matale.
        if (!payload.direction) {
          const prevLat = prevBusLatRef.current;
          if (prevLat !== null && Math.abs(payload.latitude - prevLat) > 0.00005) {
            // Only update direction when the bus has moved meaningfully (>5.5m threshold)
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
    //    Priority 3: Fallback to last known inferred direction (prevents flicker when stationary)
    let isToKandy: boolean;
    if (primaryBus.direction) {
      // Mock / future backend: explicit direction string
      isToKandy = primaryBus.direction.toUpperCase().includes("KANDY");
    } else if (inferredIsToKandy !== null) {
      // Real GPS: use lat-movement inferred direction (updated in bus_moved effect)
      isToKandy = inferredIsToKandy;
    } else {
      // Final fallback: unknown — assume northbound (Towards Matale)
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

  // Unlock camera if user manually drags map
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

  // Handle map click to extend polyline path in edit mode
  const handleMapClick = (e: google.maps.MapMouseEvent) => {
    if (!editMode || !e.latLng) return;
    const newPoint = { lat: e.latLng.lat(), lng: e.latLng.lng() };
    setDrawPath((prev) => [...prev, newPoint]);
  };

  // Add a stop by double-clicking on the map in edit mode
  const handleMapDoubleClick = (e: google.maps.MapMouseEvent) => {
    if (!editMode || !e.latLng) return;
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();

    const stopName = prompt("Enter a name for this transit stop:");
    if (!stopName) return;

    let distanceFromStart = 0;
    if (drawPath.length > 0) {
      const startCoord = drawPath[0];
      distanceFromStart = parseFloat(
        getLatLngDistance(startCoord.lat, startCoord.lng, lat, lng).toFixed(2)
      );
    }

    const newStop: RouteStop = {
      name: stopName,
      distanceFromStart,
      location: {
        type: "Point",
        coordinates: [lng, lat],
      },
    };

    setDrawStops((prev) => [...prev, newStop]);
  };

  // Save Route Edits
  const handleSaveRoute = async () => {
    if (!activeRoute) return;
    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const updatedPathCoords: [number, number][] = drawPath.map((pt) => [
      pt.lng,
      pt.lat,
    ]);

    try {
      const res = await apiClient.put(`/routes/${activeRoute.routeId}`, {
        stops: drawStops,
        path: {
          type: "LineString",
          coordinates: updatedPathCoords,
        },
      });

      if (res.status === 200) {
        setSuccessMsg(`Route ${activeRoute.routeId} updated successfully!`);
        setEditMode(false);
        fetchRoutes();
      }
    } catch (err: any) {
      console.error("Save route failed", err);
      setErrorMsg(err.response?.data?.message || "Failed to update route geometry");
    } finally {
      setSaving(false);
    }
  };

  // Delete Route
  const handleDeleteRoute = async () => {
    if (!activeRoute) return;
    if (
      !confirm(
        `Are you sure you want to delete Route ${activeRoute.routeId} (${activeRoute.routeName})?`
      )
    ) {
      return;
    }

    setDeleting(true);
    try {
      const res = await apiClient.delete(`/routes/${activeRoute.routeId}`);
      if (res.status === 200) {
        setSuccessMsg(`Route ${activeRoute.routeId} deleted.`);
        fetchRoutes();
      }
    } catch (err: any) {
      console.error("Delete route failed", err);
      setErrorMsg("Failed to delete route");
    } finally {
      setDeleting(false);
    }
  };

  // Create New Route
  const handleCreateRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRouteId || !newRouteName || !newStart || !newEnd) {
      setErrorMsg("Please fill out all required route fields.");
      return;
    }

    try {
      const payload = {
        routeId: newRouteId.toUpperCase().trim(),
        routeName: newRouteName.trim(),
        startTerminal: newStart.trim(),
        endTerminal: newEnd.trim(),
        baseFare: parseFloat(newBase) || 50,
        ratePerKm: parseFloat(newRate) || 10,
        stops: [],
        path: {
          type: "LineString",
          coordinates: [],
        },
      };

      const res = await apiClient.post("/routes", payload);
      if (res.status === 201 || res.status === 200) {
        setShowAddModal(false);
        setNewRouteId("");
        setNewRouteName("");
        setNewStart("");
        setNewEnd("");
        setSuccessMsg(`Route ${payload.routeId} created!`);
        fetchRoutes();
      }
    } catch (err: any) {
      console.error("Create route error", err);
      setErrorMsg(err.response?.data?.message || "Failed to create new route");
    }
  };

  // Clear drawn path and stops in edit mode
  const handleClearDrawing = () => {
    setDrawPath([]);
    setDrawStops([]);
  };

  // Dynamic Map Centroid
  const mapCenter = useMemo(() => {
    if (drawPath.length > 0) {
      return {
        lat: drawPath.reduce((sum, pt) => sum + pt.lat, 0) / drawPath.length,
        lng: drawPath.reduce((sum, pt) => sum + pt.lng, 0) / drawPath.length,
      };
    }
    return { lat: 7.379, lng: 80.6285 };
  }, [drawPath]);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Upper header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[var(--color-on-surface)]">
            Route Registry & Live Telemetry
          </h2>
          <p className="text-sm text-muted mt-1">
            Real-time highway driving roads, live bus location streaming, and next-stop arrival estimates.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {telemetryConnected && (
            <span className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <Radio className="h-3.5 w-3.5 animate-pulse" />
              Live Telemetry Active
            </span>
          )}
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary py-2.5 px-5 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-500/10"
          >
            <Plus className="h-4 w-4" />
            Create Transit Route
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-emerald-500 flex gap-3 text-xs animate-fade-in">
          <CheckCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 text-rose-500 flex gap-3 text-xs animate-fade-in">
          <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {loading ? (
        <div className="py-20 flex justify-center">
          <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
        </div>
      ) : routes.length === 0 ? (
        <div className="card p-12 text-center space-y-4">
          <Compass className="h-12 w-12 text-muted mx-auto opacity-30" />
          <h3 className="text-lg font-bold">No Routes Configured</h3>
          <p className="text-xs text-muted max-w-sm mx-auto">
            Get started by creating your transit network routes and scheduling stops.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary py-2.5 px-5 rounded-xl text-xs font-bold"
          >
            Add First Route
          </button>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-12">
          {/* Left Route Selector list (4 Columns) */}
          <div className="lg:col-span-4 space-y-4">
            <span className="text-[10px] font-bold text-muted uppercase tracking-widest block">
              Active Transit Routes ({routes.length})
            </span>

            <div className="space-y-3">
              {routes.map((r, index) => {
                const isActive = index === activeRouteIndex;
                const busCount = liveBuses.filter((b) => b.routeId === r.routeId).length;

                return (
                  <div
                    key={r.routeId || index}
                    onClick={() => setActiveRouteIndex(index)}
                    className={`card p-5 cursor-pointer transition-all border ${
                      isActive
                        ? "border-indigo-500 bg-indigo-500/5 shadow-md shadow-indigo-500/5"
                        : "hover:border-[var(--color-outline-variant)] hover:bg-[var(--color-surface-variant)]/30"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold font-mono bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                            Route {r.routeId}
                          </span>
                          <h4 className="font-bold text-sm text-[var(--color-on-surface)]">
                            {r.routeName}
                          </h4>
                        </div>
                        <p className="text-xs text-muted">
                          {r.startTerminal} → {r.endTerminal}
                        </p>
                      </div>

                      {busCount > 0 ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                          {busCount} Live
                        </span>
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted shrink-0 mt-1" />
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-[var(--color-outline-variant)]/50 text-[11px] text-muted">
                      <div>
                        <span className="block text-[9px] uppercase tracking-wider text-muted/70">
                          Base Fare
                        </span>
                        <span className="font-mono font-semibold text-[var(--color-on-surface)]">
                          LKR {r.baseFare.toFixed(2)}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[9px] uppercase tracking-wider text-muted/70">
                          Rate / KM
                        </span>
                        <span className="font-mono font-semibold text-[var(--color-on-surface)]">
                          LKR {r.ratePerKm.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Map & Live Telemetry Inspector (8 Columns) */}
          <div className="lg:col-span-8 space-y-6">
            {activeRoute && (
              <div className="card p-6 md:p-8 space-y-6">
                {/* Header info */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--color-outline-variant)] pb-5">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-lg text-xs font-black font-mono bg-indigo-500 text-white shadow-sm">
                        {activeRoute.routeId}
                      </span>
                      <h3 className="text-lg font-bold text-[var(--color-on-surface)]">
                        {activeRoute.routeName}
                      </h3>
                    </div>
                    <p className="text-xs text-muted mt-1">
                      {activeRoute.startTerminal} (Terminal) to {activeRoute.endTerminal} (Terminal)
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted font-mono bg-[var(--color-surface-variant)] px-3 py-1.5 rounded-xl border border-[var(--color-outline-variant)]">
                      {activeRoute.stops?.length || 0} Registered Stops
                    </span>
                    <span className="text-xs text-muted font-mono bg-[var(--color-surface-variant)] px-3 py-1.5 rounded-xl border border-[var(--color-outline-variant)]">
                      {activeRoute.path?.coordinates?.length || 0} Road Vertices
                    </span>
                  </div>
                </div>

                {/* Live Fleet Telemetry Banner */}
                {liveBuses.length > 0 ? (
                  <div className="p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 space-y-3 animate-fade-in">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping" />
                        <span className="text-xs font-bold text-emerald-500 uppercase tracking-wide">
                          Active Vehicle On Route
                        </span>
                      </div>
                      <span className="text-[10px] text-muted font-mono">
                        Streaming via WebSocket /tracking
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                      <div className="p-3 rounded-xl bg-[var(--color-surface)] border border-[var(--color-outline-variant)] space-y-0.5">
                        <span className="text-[9px] font-bold text-muted uppercase tracking-wider block">
                          Bus Plate
                        </span>
                        <div className="flex items-center gap-1.5 font-bold font-mono text-xs text-[var(--color-on-surface)]">
                          <Bus className="h-3.5 w-3.5 text-emerald-500" />
                          <span>{primaryBus?.busNumber}</span>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-[var(--color-surface)] border border-[var(--color-outline-variant)] space-y-0.5">
                        <span className="text-[9px] font-bold text-muted uppercase tracking-wider block">
                          Speed
                        </span>
                        <div className="flex items-center gap-1.5 font-bold font-mono text-xs text-indigo-500">
                          <Gauge className="h-3.5 w-3.5" />
                          <span>{Math.round(primaryBus?.speed || 0)} km/h</span>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-[var(--color-surface)] border border-[var(--color-outline-variant)] space-y-0.5">
                        <span className="text-[9px] font-bold text-muted uppercase tracking-wider block">
                          Status
                        </span>
                        <div className="flex items-center gap-1.5 font-bold font-mono text-xs text-emerald-500">
                          <Zap className="h-3.5 w-3.5" />
                          <span>{primaryBus?.status || "ACTIVE"}</span>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-[var(--color-surface)] border border-[var(--color-outline-variant)] space-y-0.5">
                        <span className="text-[9px] font-bold text-muted uppercase tracking-wider block">
                          Heading
                        </span>
                        <div className="flex items-center gap-1.5 font-bold font-mono text-xs text-sky-500">
                          <Navigation className="h-3.5 w-3.5" />
                          <span>{Math.round(primaryBus?.heading || 0)}°</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl border border-[var(--color-outline-variant)] bg-[var(--color-surface-variant)]/30 flex items-center gap-3 text-xs text-muted">
                    <Radio className="h-5 w-5 text-indigo-500 shrink-0 opacity-60" />
                    <span>
                      <strong>No Active Vehicles Streaming:</strong> When a driver goes on shift on Route {activeRoute.routeId} via the Driver App, live bus location and estimated stop arrival times (ETAs) will stream here in real-time.
                    </span>
                  </div>
                )}

                {/* Map Display & Controls */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-muted uppercase tracking-widest flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-indigo-500" />
                      Highway Road Path & Live Vehicle Position
                    </span>

                    <div className="flex items-center gap-2">
                      {editMode ? (
                        <>
                          <button
                            onClick={handleClearDrawing}
                            className="px-3 py-1.5 rounded-xl border border-rose-500/30 text-rose-500 hover:bg-rose-500/10 text-xs font-bold transition-all cursor-pointer"
                          >
                            Clear Path
                          </button>
                          <button
                            onClick={() => {
                              setEditMode(false);
                              if (activeRoute) {
                                setDrawPath(
                                  activeRoute.path?.coordinates.map(([lng, lat]) => ({
                                    lat,
                                    lng,
                                  })) || []
                                );
                                setDrawStops(activeRoute.stops || []);
                              }
                            }}
                            className="px-3 py-1.5 rounded-xl border border-[var(--color-outline-variant)] text-muted hover:bg-[var(--color-surface-variant)] text-xs font-bold transition-all cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleSaveRoute}
                            disabled={saving}
                            className="btn-primary px-4 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-500/20"
                          >
                            {saving ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : null}
                            Save Geometry
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={handleDeleteRoute}
                            disabled={deleting}
                            className="p-2 rounded-xl border border-rose-500/20 text-rose-500 hover:bg-rose-500/10 transition-all cursor-pointer"
                            title="Delete Route"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setEditMode(true)}
                            className="btn-primary px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                          >
                            Draw / Edit Map
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {editMode && (
                    <div className="p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-xl text-[10px] text-muted leading-relaxed">
                      💡 <strong>Edit Mode Active:</strong> Click anywhere on the map to define the bus path polyline. Double-click on the map to place a named stop marker.
                    </div>
                  )}

                  <div
                    ref={containerRef}
                    className={`relative border border-[var(--color-outline-variant)] overflow-hidden bg-[#0c0c12] transition-all duration-300 ${
                      isFullscreen ? "w-screen h-screen rounded-none" : "h-[400px] rounded-2xl"
                    }`}
                  >
                    {!isLoaded ? (
                      <div className="h-full w-full flex flex-col items-center justify-center gap-2">
                        {loadError ? (
                          <div className="text-red-400 text-xs">
                            Failed to load Google Maps script. Check key.
                          </div>
                        ) : (
                          <>
                            <Loader2 className="h-6 w-6 text-indigo-500 animate-spin" />
                            <span className="text-[10px] text-muted">
                              Loading Google Maps...
                            </span>
                          </>
                        )}
                      </div>
                    ) : (
                      <>
                        <GoogleMap
                        mapContainerClassName="w-full h-full"
                        center={mapCenter}
                        zoom={11}
                        onLoad={(map) => setMapRef(map)}
                        onClick={handleMapClick}
                        onDblClick={handleMapDoubleClick}
                        onDragStart={handleMapDragStart}
                        options={{
                          disableDoubleClickZoom: true,
                          fullscreenControl: false,
                          styles: [
                            { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
                            { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
                            { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
                            {
                              featureType: "administrative.locality",
                              elementType: "labels.text.fill",
                              stylers: [{ color: "#d59563" }],
                            },
                            {
                              featureType: "poi",
                              elementType: "labels.text.fill",
                              stylers: [{ color: "#d59563" }],
                            },
                            {
                              featureType: "road",
                              elementType: "geometry",
                              stylers: [{ color: "#38414e" }],
                            },
                            {
                              featureType: "road",
                              elementType: "geometry.stroke",
                              stylers: [{ color: "#212a37" }],
                            },
                            {
                              featureType: "road",
                              elementType: "labels.text.fill",
                              stylers: [{ color: "#9ca5b3" }],
                            },
                            {
                              featureType: "transit",
                              elementType: "geometry",
                              stylers: [{ color: "#2f3948" }],
                            },
                            {
                              featureType: "water",
                              elementType: "geometry",
                              stylers: [{ color: "#17263c" }],
                            },
                          ],
                        }}
                      >
                        {/* High-Resolution Road Polyline */}
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

                        {/* Stop Markers */}
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

                        {/* Live Moving Bus Markers — Animated Uber-style */}
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
                              {/* Pulsing ring layers — always centred, never rotated */}
                              <span style={{
                                position: "absolute",
                                top: "50%",
                                left: "50%",
                                transform: "translate(-50%, -50%)",
                                width: 72,
                                height: 72,
                                borderRadius: "50%",
                                background: "rgba(34,197,94,0.18)",
                                animation: "busRingPulse 2s ease-out infinite",
                                pointerEvents: "none",
                              }} />
                              <span style={{
                                position: "absolute",
                                top: "50%",
                                left: "50%",
                                transform: "translate(-50%, -50%)",
                                width: 52,
                                height: 52,
                                borderRadius: "50%",
                                background: "rgba(34,197,94,0.25)",
                                animation: "busRingPulse 2s ease-out 0.4s infinite",
                                pointerEvents: "none",
                              }} />

                              {/* Directional heading arrow — ONLY this rotates */}
                              <div style={{
                                position: "absolute",
                                top: -10,
                                left: "50%",
                                transform: `translateX(-50%) rotate(${bus.heading}deg)`,
                                transformOrigin: "50% 28px",
                                transition: "transform 1.2s ease",
                                pointerEvents: "none",
                              }}>
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

                              {/* Main bus capsule — UPRIGHT, never rotated */}
                              <div style={{
                                position: "relative",
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                                background: "linear-gradient(135deg,#16a34a,#22c55e)",
                                border: "2.5px solid rgba(255,255,255,0.9)",
                                borderRadius: 24,
                                padding: "7px 14px 7px 10px",
                                boxShadow: "0 4px 20px rgba(34,197,94,0.55), 0 2px 6px rgba(0,0,0,0.35)",
                                minWidth: 52,
                              }}>
                                {/* Bus SVG icon — always upright */}
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="white" style={{ flexShrink: 0 }}>
                                  <path d="M4 16c0 .88.39 1.67 1 2.22V20a1 1 0 0 0 2 0v-1h10v1a1 1 0 0 0 2 0v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm9 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zM6 9V6h12v3H6z"/>
                                </svg>
                                {/* Speed indicator dot */}
                                <span style={{
                                  width: 6,
                                  height: 6,
                                  borderRadius: "50%",
                                  background: bus.speed > 10 ? "#bbf7d0" : "#fde68a",
                                  flexShrink: 0,
                                }} />
                              </div>

                              {/* Bus plate label — always upright */}
                              <div style={{
                                marginTop: 5,
                                background: "rgba(0,0,0,0.82)",
                                backdropFilter: "blur(6px)",
                                color: "#22c55e",
                                fontFamily: "monospace",
                                fontWeight: 700,
                                fontSize: 11,
                                letterSpacing: "0.05em",
                                padding: "3px 9px",
                                borderRadius: 99,
                                border: "1px solid rgba(34,197,94,0.4)",
                                whiteSpace: "nowrap",
                                pointerEvents: "none",
                              }}>
                                🚌 {bus.busNumber}
                              </div>
                              <style>{`
                                @keyframes busRingPulse {
                                  0%   { transform: translate(-50%,-50%) scale(0.6); opacity:0.9; }
                                  100% { transform: translate(-50%,-50%) scale(1.9); opacity:0; }
                                }
                                @keyframes spinSlow {
                                  from { transform: rotate(0deg); }
                                  to { transform: rotate(360deg); }
                                }
                                .animate-spin-slow {
                                  animation: spinSlow 8s linear infinite;
                                }
                              `}</style>
                            </div>
                          </OverlayView>
                        ))}
                      </GoogleMap>

                      <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-2">
                        {primaryBus && (
                          <button
                            onClick={() => {
                              const targetState = !isLockedOnBus;
                              setIsLockedOnBus(targetState);
                              if (targetState && mapRef) {
                                mapRef.panTo({ lat: primaryBus.latitude, lng: primaryBus.longitude });
                              }
                            }}
                            className={`p-3 rounded-xl shadow-lg border flex items-center justify-center transition-all duration-300 backdrop-blur-md cursor-pointer ${
                              isLockedOnBus
                                ? "bg-emerald-500 text-white border-emerald-400 hover:bg-emerald-600"
                                : "bg-[var(--color-surface)]/95 text-[var(--color-on-surface)] border-[var(--color-outline-variant)] hover:bg-[var(--color-surface-variant)]"
                            }`}
                            title={isLockedOnBus ? "Unlock camera from bus" : "Lock camera on bus"}
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
                          title="Fit map to route"
                        >
                          <Navigation className="h-4.5 w-4.5 rotate-45" />
                        </button>

                        <button
                          onClick={toggleFullscreen}
                          className="p-3 rounded-xl bg-[var(--color-surface)]/95 text-[var(--color-on-surface)] border border-[var(--color-outline-variant)] hover:bg-[var(--color-surface-variant)] shadow-lg transition-all backdrop-blur-md cursor-pointer"
                          title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                        >
                          {isFullscreen ? (
                            <Minimize2 className="h-4.5 w-4.5" />
                          ) : (
                            <Maximize2 className="h-4.5 w-4.5" />
                          )}
                        </button>
                      </div>
                    </>
                  )}
                </div>
                </div>

                {/* Real-Time Next-Stop Arrival Times & Stops Registry */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-muted uppercase tracking-widest flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 text-indigo-500" />
                      Live Stop Schedule & Estimated Arrival Times (ETA)
                    </span>
                    {primaryBus && (
                      <div className="flex items-center gap-2">
                        {busRouteInfo && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                            <Navigation className="h-3 w-3" />
                            {busRouteInfo.directionLabel}
                          </span>
                        )}
                        <span className="text-[10px] font-mono text-emerald-500 font-bold">
                          Live Bus {primaryBus.busNumber}
                        </span>
                      </div>
                    )}
                  </div>

                  {drawStops.length === 0 ? (
                    <div className="text-center py-6 text-xs text-muted border border-dashed border-[var(--color-outline-variant)] rounded-xl">
                      No stops defined for this route path yet.
                    </div>
                  ) : (
                    <div className="overflow-x-auto border border-[var(--color-outline-variant)] rounded-2xl">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-[var(--color-surface-variant)]/60 text-[9px] font-bold text-muted uppercase tracking-wider border-b border-[var(--color-outline-variant)]">
                            <th className="py-3 pl-4">#</th>
                            <th className="py-3">Stop Name</th>
                            <th className="py-3">Dist. from Terminal</th>
                            <th className="py-3">Live Arrival Time (ETA)</th>
                            <th className="py-3 pr-4">Fare from Start</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--color-outline-variant)] text-xs">
                          {orderedStops.map((stop, idx) => {
                            const totalRouteLength =
                              routePathMetrics?.totalLength ||
                              (drawStops.length > 0
                                ? drawStops[drawStops.length - 1].distanceFromStart
                                : 25.7);
                            const displayKm = busRouteInfo?.isToKandy
                              ? Math.max(0, totalRouteLength - stop.distanceFromStart)
                              : stop.distanceFromStart;
                            const stopFare =
                              activeRoute.baseFare +
                              displayKm * activeRoute.ratePerKm;
                            const etaInfo = calculateStopETA(stop, primaryBus);

                            return (
                              <tr
                                key={`company-stop-${stop.name}-${idx}`}
                                className={`transition-colors ${
                                  etaInfo?.status === "At Stop"
                                    ? "bg-emerald-500/5 font-semibold"
                                    : etaInfo?.isPast
                                    ? "opacity-60 bg-[var(--color-surface-variant)]/10"
                                    : "hover:bg-[var(--color-surface-variant)]/30"
                                }`}
                              >
                                <td className="py-3 pl-4 font-mono font-bold text-muted">
                                  {etaInfo?.isPast ? (
                                    <CheckCircle className="h-3.5 w-3.5 text-emerald-500/70 inline" />
                                  ) : (
                                    idx + 1
                                  )}
                                </td>
                                <td className="py-3 font-semibold text-[var(--color-on-surface)] flex items-center gap-2">
                                  <MapPin className={`h-3.5 w-3.5 ${etaInfo?.isPast ? "text-slate-400" : "text-indigo-500"}`} />
                                  <span className={etaInfo?.isPast ? "text-slate-400" : ""}>{stop.name}</span>
                                </td>
                                <td className="py-3 text-muted font-mono">
                                  {displayKm.toFixed(1)} km
                                </td>
                                <td className="py-3">
                                  {etaInfo ? (
                                    <div className="flex items-center gap-2">
                                      <span
                                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold font-mono ${
                                          etaInfo.status === "At Stop"
                                            ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 animate-pulse"
                                            : etaInfo.isPast
                                            ? "bg-slate-500/10 text-slate-400 border border-slate-500/20"
                                            : "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                                        }`}
                                      >
                                        {etaInfo.text}
                                      </span>
                                      <span className="text-[11px] font-mono text-muted">
                                        ({etaInfo.clockTime})
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-muted font-mono text-[11px]">
                                      — (Waiting for active shift)
                                    </span>
                                  )}
                                </td>
                                <td className="py-3 pr-4 font-mono font-semibold text-emerald-500">
                                  LKR {stopFare.toFixed(2)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Route Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="card max-w-md w-full p-6 space-y-6 border border-[var(--color-outline-variant)]">
            <div className="flex items-center justify-between border-b border-[var(--color-outline-variant)] pb-4">
              <h3 className="text-base font-bold text-[var(--color-on-surface)]">
                Create Transit Route
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-muted hover:text-[var(--color-on-surface)] text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateRoute} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted uppercase tracking-widest block">
                  Route Identifier Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. 593 or 138"
                  value={newRouteId}
                  onChange={(e) => setNewRouteId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--color-outline-variant)] bg-[var(--color-surface-variant)] text-xs text-[var(--color-on-surface)] font-mono font-bold focus:outline-none focus:border-indigo-500 uppercase"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted uppercase tracking-widest block">
                  Route Name / Corridor
                </label>
                <input
                  type="text"
                  placeholder="e.g. Kandy - Matale"
                  value={newRouteName}
                  onChange={(e) => setNewRouteName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--color-outline-variant)] bg-[var(--color-surface-variant)] text-xs text-[var(--color-on-surface)] focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted uppercase tracking-widest block">
                    Start Terminal
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Kandy"
                    value={newStart}
                    onChange={(e) => setNewStart(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--color-outline-variant)] bg-[var(--color-surface-variant)] text-xs text-[var(--color-on-surface)] focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted uppercase tracking-widest block">
                    End Terminal
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Matale"
                    value={newEnd}
                    onChange={(e) => setNewEnd(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--color-outline-variant)] bg-[var(--color-surface-variant)] text-xs text-[var(--color-on-surface)] focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted uppercase tracking-widest block">
                    Base Fare (LKR)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="5"
                    value={newBase}
                    onChange={(e) => setNewBase(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--color-outline-variant)] bg-[var(--color-surface-variant)] text-xs text-[var(--color-on-surface)] font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted uppercase tracking-widest block">
                    Rate per KM (LKR)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={newRate}
                    onChange={(e) => setNewRate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--color-outline-variant)] bg-[var(--color-surface-variant)] text-xs text-[var(--color-on-surface)] font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-[var(--color-outline-variant)] text-xs font-bold text-muted cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 btn-primary py-2.5 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Create Route
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CompanyRoutesPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 flex justify-center">
          <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
        </div>
      }
    >
      <CompanyRoutesContent />
    </Suspense>
  );
}
