"use client";

import React, { useEffect, useState } from "react";
import { apiClient } from "@/core/lib/api-client";
import {
  GoogleMap,
  useJsApiLoader,
  Polyline,
  Marker,
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

export default function CompanyRoutesPage() {
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
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchRoutes = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get("/routes");
      if (res.status === 200) {
        setRoutes(res.data);
        if (res.data.length > 0) {
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
      const coords = activeRoute.path?.coordinates.map(([lng, lat]) => ({
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

    // Calculate distance from start terminal (first coordinate in path)
    let distanceFromStart = 0;
    if (drawPath.length > 0) {
      distanceFromStart = getLatLngDistance(
        drawPath[0].lat,
        drawPath[0].lng,
        lat,
        lng
      );
    }

    const newStop: RouteStop = {
      name: stopName,
      distanceFromStart: parseFloat(distanceFromStart.toFixed(2)),
      location: {
        type: "Point",
        coordinates: [lng, lat],
      },
    };

    setDrawStops((prev) => [...prev, newStop]);
  };

  // Add Route DTO creation and POST to backend
  const handleAddRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRouteId || !newRouteName || !newStart || !newEnd) return;

    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const defaultCoords: [number, number][] = [
      [79.8612, 6.9271], // Colombo center
      [79.8812, 6.9471],
    ];

    const routeObj: TransitRoute = {
      routeId: newRouteId,
      routeName: newRouteName,
      startTerminal: newStart,
      endTerminal: newEnd,
      baseFare: parseFloat(newBase) || 50,
      ratePerKm: parseFloat(newRate) || 10,
      stops: [
        {
          name: newStart,
          distanceFromStart: 0,
          location: { type: "Point", coordinates: defaultCoords[0] },
        },
        {
          name: newEnd,
          distanceFromStart: 5.0,
          location: { type: "Point", coordinates: defaultCoords[1] },
        },
      ],
      path: {
        type: "LineString",
        coordinates: defaultCoords,
      },
    };

    try {
      const res = await apiClient.post("/routes", routeObj);
      if (res.status === 200 || res.status === 201) {
        setSuccessMsg(`Route ${newRouteId} registered successfully!`);
        setShowAddModal(false);
        await fetchRoutes();
        // Clear form
        setNewRouteId("");
        setNewRouteName("");
        setNewStart("");
        setNewEnd("");
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || "Failed to register new route");
    } finally {
      setSaving(false);
    }
  };

  // Save the drawn path and stops to Mongoose backend
  const handleSaveMapChanges = async () => {
    if (!activeRoute) return;

    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const updatedRoute: TransitRoute = {
      ...activeRoute,
      stops: drawStops,
      path: {
        type: "LineString",
        coordinates: drawPath.map((pt) => [pt.lng, pt.lat]),
      },
    };

    try {
      const res = await apiClient.post("/routes", updatedRoute);
      if (res.status === 200 || res.status === 201) {
        setSuccessMsg("Route map configuration saved successfully!");
        setEditMode(false);
        await fetchRoutes();
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || "Failed to save route layout");
    } finally {
      setSaving(false);
    }
  };

  // Delete route trigger
  const handleDeleteRoute = async () => {
    if (!activeRoute) return;
    const confirmDelete = window.confirm(
      `Are you sure you want to delete Route ${activeRoute.routeId}?`
    );
    if (!confirmDelete) return;

    setDeleting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await apiClient.delete(`/routes/${activeRoute.routeId}`);
      if (res.status === 200 || res.status === 204) {
        setSuccessMsg(`Route ${activeRoute.routeId} deleted successfully.`);
        await fetchRoutes();
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || "Failed to delete route");
    } finally {
      setDeleting(false);
    }
  };

  // Clear drawn path and stops in edit mode
  const handleClearDrawing = () => {
    setDrawPath([]);
    setDrawStops([]);
  };

  // Colombo Default map bounds
  const mapCenter = drawPath.length > 0 ? drawPath[0] : { lat: 6.9271, lng: 79.8612 };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Upper header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[var(--color-on-surface)]">
            Route Registry Management
          </h2>
          <p className="text-sm text-muted mt-1">
            Configure line terminals, distance rates, and scheduling stops for transit schedules.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary py-2.5 px-5 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-500/10"
        >
          <Plus className="h-4 w-4" />
          Create Transit Route
        </button>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-emerald-500 flex gap-3 text-xs">
          <CheckCircle className="h-4.5 w-4.5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-red-500 flex gap-3 text-xs">
          <AlertCircle className="h-4.5 w-4.5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {loading ? (
        <div className="py-20 flex justify-center">
          <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
        </div>
      ) : (
        /* Main Grid Layout */
        <div className="grid gap-8 lg:grid-cols-12">
          {/* Left Side: Route Select List - 4 columns */}
          <div className="lg:col-span-4 space-y-4">
            <div className="card p-5 space-y-4">
              <span className="text-[10px] font-bold text-muted uppercase tracking-widest block">
                Active Transit Routes
              </span>

              {routes.length === 0 ? (
                <div className="text-center py-8 text-xs text-muted">
                  No active routes configured in registry database.
                </div>
              ) : (
                <div className="space-y-2">
                  {routes.map((route, index) => {
                    const isActive = index === activeRouteIndex;
                    return (
                      <button
                        key={route.routeId}
                        onClick={() => setActiveRouteIndex(index)}
                        className={`w-full text-left p-4 rounded-xl border transition-all cursor-pointer flex justify-between items-center ${
                          isActive
                            ? "border-indigo-500 bg-indigo-500/5 text-[var(--color-on-surface)] shadow-sm"
                            : "border-[var(--color-outline-variant)] hover:bg-[var(--color-surface-variant)]/60 text-muted"
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[10px] font-black px-2 py-0.5 rounded ${
                                isActive
                                  ? "bg-indigo-500 text-white"
                                  : "bg-[var(--color-surface-variant)] text-[var(--color-on-surface)]"
                              }`}
                            >
                              {route.routeId}
                            </span>
                            <span className="text-xs font-bold">
                              {route.routeName}
                            </span>
                          </div>
                          <div className="text-[10px] text-muted mt-2">
                            {route.startTerminal} → {route.endTerminal}
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 shrink-0 text-muted" />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="card p-5 space-y-3.5">
              <div className="flex gap-2.5 items-start">
                <Info className="h-4.5 w-4.5 text-indigo-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-[11px] font-bold text-[var(--color-on-surface)]">
                    Geofenced Auto Deductions
                  </h4>
                  <p className="text-[10px] text-muted leading-relaxed mt-1">
                    Passenger fares are computed based on the GPS coordinates
                    matched against stops in the registry. Ensure distance entries
                    match actual highways.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side: Route Details, Stops, and Map Draw - 8 columns */}
          {activeRoute && (
            <div className="lg:col-span-8 space-y-8 animate-fade-in">
              {/* Route Detail Card */}
              <div className="card p-6 md:p-8 space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[var(--color-outline-variant)] pb-5">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs font-black px-2.5 py-1 rounded bg-indigo-500 text-white">
                        Route {activeRoute.routeId}
                      </span>
                      <h3 className="text-lg font-bold text-[var(--color-on-surface)]">
                        {activeRoute.routeName}
                      </h3>
                    </div>
                    <p className="text-xs text-muted mt-1.5">
                      Configure pricing and stops scheduling for this active transit link.
                    </p>
                  </div>

                  <div className="flex gap-4">
                    <div className="text-right">
                      <span className="text-[9px] font-bold text-muted uppercase tracking-wider block">
                        Base Fare
                      </span>
                      <span className="text-xs font-black text-emerald-500 block mt-0.5">
                        LKR {activeRoute.baseFare.toFixed(2)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] font-bold text-muted uppercase tracking-wider block">
                        Rate / KM
                      </span>
                      <span className="text-xs font-black text-indigo-500 block mt-0.5">
                        LKR {activeRoute.ratePerKm.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Google Map Polyline Drawer */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-muted uppercase tracking-widest flex items-center gap-1.5">
                      <Map className="h-4 w-4 text-indigo-500" />
                      Interactive Route Map Designer
                    </span>

                    <div className="flex gap-2">
                      {editMode ? (
                        <>
                          <button
                            onClick={handleClearDrawing}
                            className="px-3 py-1.5 border border-red-500/20 text-red-500 hover:bg-red-500/5 text-[10px] font-bold rounded-lg cursor-pointer"
                          >
                            Clear Map
                          </button>
                          <button
                            onClick={() => setEditMode(false)}
                            className="px-3 py-1.5 border border-[var(--color-outline-variant)] text-[10px] font-bold rounded-lg cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleSaveMapChanges}
                            disabled={saving}
                            className="btn-primary px-3 py-1.5 text-[10px] font-bold rounded-lg cursor-pointer flex items-center gap-1"
                          >
                            {saving && <Loader2 className="h-3 w-3 animate-spin" />}
                            Save Path
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={handleDeleteRoute}
                            disabled={deleting}
                            className="px-3 py-1.5 border border-red-500/20 text-red-500 hover:bg-red-500/5 text-[10px] font-bold rounded-lg cursor-pointer flex items-center gap-1"
                          >
                            {deleting && <Loader2 className="h-3 w-3 animate-spin" />}
                            <Trash2 className="h-3 w-3" />
                            Delete Route
                          </button>
                          <button
                            onClick={() => setEditMode(true)}
                            className="btn-primary px-3 py-1.5 text-[10px] font-bold rounded-lg cursor-pointer"
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

                  <div className="relative border border-[var(--color-outline-variant)] rounded-2xl overflow-hidden h-[380px] bg-[#0c0c12]">
                    {!isLoaded ? (
                      <div className="h-full w-full flex flex-col items-center justify-center gap-2">
                        {loadError ? (
                          <div className="text-red-400 text-xs">Failed to load Google Maps script. Check key.</div>
                        ) : (
                          <>
                            <Loader2 className="h-6 w-6 text-indigo-500 animate-spin" />
                            <span className="text-[10px] text-muted">Loading Google Maps...</span>
                          </>
                        )}
                      </div>
                    ) : (
                      <GoogleMap
                        mapContainerClassName="w-full h-full"
                        center={mapCenter}
                        zoom={13}
                        onClick={handleMapClick}
                        onDblClick={handleMapDoubleClick}
                        options={{
                          disableDoubleClickZoom: true,
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
                        {/* Drawn Route Polyline */}
                        {drawPath.length > 1 && (
                          <Polyline
                            path={drawPath}
                            options={{
                              strokeColor: "#6366f1",
                              strokeOpacity: 0.8,
                              strokeWeight: 4,
                            }}
                          />
                        )}

                        {/* Stop Markers */}
                        {drawStops.map((stop, idx) => (
                          <Marker
                            key={idx}
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
                      </GoogleMap>
                    )}
                  </div>
                </div>

                {/* Stops Table Grid */}
                <div className="space-y-4">
                  <span className="text-[10px] font-bold text-muted uppercase tracking-widest block">
                    Stops Registry
                  </span>

                  {drawStops.length === 0 ? (
                    <div className="text-center py-6 text-xs text-muted border border-dashed border-[var(--color-outline-variant)] rounded-xl">
                      No stops defined for this route path yet.
                    </div>
                  ) : (
                    <div className="overflow-x-auto border border-[var(--color-outline-variant)] rounded-xl">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-[var(--color-surface-variant)]/60 text-[9px] font-bold text-muted uppercase tracking-wider border-b border-[var(--color-outline-variant)]">
                            <th className="py-2.5 pl-3">Stop Name</th>
                            <th className="py-2.5">Dist. from Terminal</th>
                            <th className="py-2.5">Fare from Start</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--color-outline-variant)] text-xs">
                          {drawStops.map((stop, idx) => {
                            const stopFare =
                              activeRoute.baseFare +
                              stop.distanceFromStart * activeRoute.ratePerKm;
                            return (
                              <tr
                                key={idx}
                                className="hover:bg-[var(--color-surface-variant)]/30 transition-colors"
                              >
                                <td className="py-3 pl-3 font-semibold text-[var(--color-on-surface)]">
                                  {stop.name}
                                </td>
                                <td className="py-3 font-mono text-muted">
                                  {stop.distanceFromStart.toFixed(2)} km
                                </td>
                                <td className="py-3 font-mono font-semibold text-emerald-500">
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
            </div>
          )}
        </div>
      )}

      {/* Add Route Dialog */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="card w-full max-w-md p-6 space-y-6 shadow-2xl relative">
            <h3 className="text-base font-bold text-[var(--color-on-surface)]">
              Register New Transit Route
            </h3>

            <form onSubmit={handleAddRoute} className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1 col-span-1">
                  <label className="text-[9px] font-bold text-muted uppercase tracking-wider">
                    Route ID
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 138"
                    value={newRouteId}
                    onChange={(e) => setNewRouteId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[var(--color-outline-variant)] bg-[var(--color-surface-variant)] text-xs text-[var(--color-on-surface)] focus:outline-none"
                  />
                </div>
                <div className="space-y-1 col-span-2">
                  <label className="text-[9px] font-bold text-muted uppercase tracking-wider">
                    Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Kottawa - Pettah"
                    value={newRouteName}
                    onChange={(e) => setNewRouteName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[var(--color-outline-variant)] bg-[var(--color-surface-variant)] text-xs text-[var(--color-on-surface)] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-muted uppercase tracking-wider">
                    Start Terminal
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Kottawa"
                    value={newStart}
                    onChange={(e) => setNewStart(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[var(--color-outline-variant)] bg-[var(--color-surface-variant)] text-xs text-[var(--color-on-surface)] focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-muted uppercase tracking-wider">
                    End Terminal
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Pettah"
                    value={newEnd}
                    onChange={(e) => setNewEnd(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[var(--color-outline-variant)] bg-[var(--color-surface-variant)] text-xs text-[var(--color-on-surface)] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-muted uppercase tracking-wider">
                    Base Fare (LKR)
                  </label>
                  <input
                    type="number"
                    required
                    value={newBase}
                    onChange={(e) => setNewBase(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[var(--color-outline-variant)] bg-[var(--color-surface-variant)] text-xs text-[var(--color-on-surface)] focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-muted uppercase tracking-wider">
                    Rate Per KM (LKR)
                  </label>
                  <input
                    type="number"
                    required
                    value={newRate}
                    onChange={(e) => setNewRate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[var(--color-outline-variant)] bg-[var(--color-surface-variant)] text-xs text-[var(--color-on-surface)] focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-[var(--color-outline-variant)] hover:bg-[var(--color-surface-variant)] rounded-xl text-xs font-bold text-[var(--color-on-surface)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary px-4 py-2 rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1"
                >
                  {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Save Route
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
