"use client";

import React, { useState } from "react";
import {
  Compass,
  MapPin,
  Plus,
  Trash2,
  DollarSign,
  Route,
  ChevronRight,
  Info,
  Clock
} from "lucide-react";

interface RouteStop {
  name: string;
  distanceFromStart: number; // in km
}

interface TransitRoute {
  routeId: string;
  routeName: string;
  startTerminal: string;
  endTerminal: string;
  baseFare: number;
  ratePerKm: number;
  stops: RouteStop[];
}

export default function CompanyRoutesPage() {
  const [routes, setRoutes] = useState<TransitRoute[]>([
    {
      routeId: "138",
      routeName: "Maharagama - Pettah",
      startTerminal: "Maharagama",
      endTerminal: "Pettah",
      baseFare: 50.0,
      ratePerKm: 10.0,
      stops: [
        { name: "Maharagama Terminal", distanceFromStart: 0 },
        { name: "Nugegoda Junction", distanceFromStart: 4.8 },
        { name: "Kirulapone", distanceFromStart: 7.2 },
        { name: "Tummulla", distanceFromStart: 9.5 },
        { name: "Pettah Central Bus Stand", distanceFromStart: 15.0 }
      ]
    },
    {
      routeId: "120",
      routeName: "Horana - Pettah",
      startTerminal: "Horana",
      endTerminal: "Pettah",
      baseFare: 50.0,
      ratePerKm: 10.0,
      stops: [
        { name: "Horana Terminal", distanceFromStart: 0 },
        { name: "Kahathuduwa", distanceFromStart: 12.3 },
        { name: "Piliyandala", distanceFromStart: 19.5 },
        { name: "Nugegoda", distanceFromStart: 28.1 },
        { name: "Pettah Central Bus Stand", distanceFromStart: 38.5 }
      ]
    },
    {
      routeId: "177",
      routeName: "Kaduwela - Kollupitiya",
      startTerminal: "Kaduwela",
      endTerminal: "Kollupitiya",
      baseFare: 50.0,
      ratePerKm: 12.0,
      stops: [
        { name: "Kaduwela Interchange", distanceFromStart: 0 },
        { name: "Malabe", distanceFromStart: 6.2 },
        { name: "Koswatta", distanceFromStart: 9.8 },
        { name: "Battaramulla", distanceFromStart: 11.5 },
        { name: "Kollupitiya Junction", distanceFromStart: 19.8 }
      ]
    }
  ]);

  const [activeRouteIndex, setActiveRouteIndex] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);

  // New Route Form State
  const [newRouteId, setNewRouteId] = useState("");
  const [newRouteName, setNewRouteName] = useState("");
  const [newStart, setNewStart] = useState("");
  const [newEnd, setNewEnd] = useState("");
  const [newBase, setNewBase] = useState("50");
  const [newRate, setNewRate] = useState("10");

  const activeRoute = routes[activeRouteIndex];

  const handleAddRoute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRouteId || !newRouteName || !newStart || !newEnd) return;

    const routeObj: TransitRoute = {
      routeId: newRouteId,
      routeName: newRouteName,
      startTerminal: newStart,
      endTerminal: newEnd,
      baseFare: parseFloat(newBase) || 50,
      ratePerKm: parseFloat(newRate) || 10,
      stops: [
        { name: newStart, distanceFromStart: 0 },
        { name: newEnd, distanceFromStart: 10.0 }
      ]
    };

    setRoutes([...routes, routeObj]);
    setActiveRouteIndex(routes.length); // focus the new route
    setShowAddModal(false);

    // Reset Form
    setNewRouteId("");
    setNewRouteName("");
    setNewStart("");
    setNewEnd("");
  };

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

      {/* Main Grid Layout */}
      <div className="grid gap-8 lg:grid-cols-12">
        {/* Left Side: Route Select List - 4 columns */}
        <div className="lg:col-span-4 space-y-4">
          <div className="card p-5 space-y-4">
            <span className="text-[10px] font-bold text-muted uppercase tracking-widest block">
              Active Transit Routes
            </span>

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
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded ${
                          isActive ? "bg-indigo-500 text-white" : "bg-[var(--color-surface-variant)] text-[var(--color-on-surface)]"
                        }`}>
                          {route.routeId}
                        </span>
                        <span className="text-xs font-bold">{route.routeName}</span>
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
          </div>

          <div className="card p-5 space-y-3.5">
            <div className="flex gap-2.5 items-start">
              <Info className="h-4.5 w-4.5 text-indigo-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-[11px] font-bold text-[var(--color-on-surface)]">
                  Geofenced Auto Deductions
                </h4>
                <p className="text-[10px] text-muted leading-relaxed mt-1">
                  Passenger fares are computed based on the GPS coordinates matched against stops in the registry. Ensure distance entries match actual highways.
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

              {/* Stop Schematic Visualization */}
              <div>
                <span className="text-[10px] font-bold text-muted uppercase tracking-widest block mb-4">
                  Transit Line Map Sketch
                </span>
                
                {/* Horizontal schematic track */}
                <div className="relative pt-8 pb-4 px-2">
                  {/* Track Line */}
                  <div className="absolute top-[37px] left-0 right-0 h-1 bg-[var(--color-outline-variant)] rounded-full z-0" />
                  
                  {/* Stop Points */}
                  <div className="flex justify-between relative z-10">
                    {activeRoute.stops.map((stop, idx) => {
                      const isEnd = idx === activeRoute.stops.length - 1;
                      const isStart = idx === 0;

                      return (
                        <div key={idx} className="flex flex-col items-center text-center max-w-[80px]">
                          <div className={`h-4 w-4 rounded-full flex items-center justify-center border-2 border-[var(--color-surface)] ${
                            isStart || isEnd ? "bg-indigo-500 h-5 w-5 border-indigo-400" : "bg-neutral-500"
                          }`} />
                          <span className="text-[9px] font-bold text-[var(--color-on-surface)] mt-2 line-clamp-2">
                            {stop.name}
                          </span>
                          <span className="text-[8px] text-muted mt-0.5 font-mono">
                            {stop.distanceFromStart} KM
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Stops Table Grid */}
              <div className="space-y-4">
                <span className="text-[10px] font-bold text-muted uppercase tracking-widest block">
                  Stops Registry
                </span>

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
                      {activeRoute.stops.map((stop, idx) => {
                        const stopFare = activeRoute.baseFare + stop.distanceFromStart * activeRoute.ratePerKm;
                        return (
                          <tr key={idx} className="hover:bg-[var(--color-surface-variant)]/30 transition-colors">
                            <td className="py-3 pl-3 font-semibold text-[var(--color-on-surface)]">
                              {stop.name}
                            </td>
                            <td className="py-3 font-mono text-muted">
                              {stop.distanceFromStart.toFixed(1)} km
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
              </div>
            </div>
          </div>
        )}
      </div>

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
                  className="btn-primary px-4 py-2 rounded-xl text-xs font-bold cursor-pointer"
                >
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
