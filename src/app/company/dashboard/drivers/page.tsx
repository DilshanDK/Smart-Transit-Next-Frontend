"use client";

import React, { useEffect, useState } from "react";
import { apiClient } from "@/core/lib/api-client";
import {
  Users,
  UserPlus,
  Search,
  Mail,
  Shield,
  CreditCard,
  CheckCircle,
  XCircle,
  Loader2,
  Lock,
  RefreshCw,
  Clock,
  Star,
  Award,
  Activity,
  Copy,
  Route
} from "lucide-react";

interface Driver {
  _id: string;
  fullName: string;
  email: string;
  licenseNumber: string;
  isOnShift: boolean;
  currentBusRegistration?: string;
  assignedRouteId?: string;
  createdAt?: string;
}

export default function CompanyDriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Selected Driver Metrics Modal State
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [resetPasswordSuccess, setResetPasswordSuccess] = useState("");

  // Form State
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Assignment State
  const [routes, setRoutes] = useState<any[]>([]);
  const [assignRouteId, setAssignRouteId] = useState("");
  const [assignBusReg, setAssignBusReg] = useState("");
  const [assigningDuty, setAssigningDuty] = useState(false);
  const [assignSuccess, setAssignSuccess] = useState("");
  const [assignError, setAssignError] = useState("");

  const fetchDrivers = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get("/company/drivers");
      if (res.status === 200) {
        setDrivers(res.data);
      }
    } catch (err) {
      console.error("Failed to load company drivers", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchRoutes = async () => {
    try {
      const res = await apiClient.get("/routes");
      if (res.status === 200) {
        setRoutes(res.data);
      }
    } catch (err) {
      console.error("Failed to load routes", err);
    }
  };

  useEffect(() => {
    fetchDrivers();
    fetchRoutes();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDrivers();
  };

  const handleRegisterDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setSubmitting(true);

    try {
      const payload = {
        fullName,
        email,
        licenseNumber,
        ...(password ? { password } : {})
      };

      const res = await apiClient.post("/company/drivers", payload);

      if (res.status === 201) {
        setSuccessMsg("Driver registered successfully! Temporary password set.");
        setFullName("");
        setEmail("");
        setLicenseNumber("");
        setPassword("");
        setShowAddModal(false);
        fetchDrivers();
      }
    } catch (err: any) {
      console.error("Failed to register driver", err);
      setErrorMsg(err.response?.data?.message || "Failed to register driver. Please check inputs.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignDuty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDriver) return;
    setAssigningDuty(true);
    setAssignSuccess("");
    setAssignError("");

    try {
      const res = await apiClient.post(`/company/drivers/${selectedDriver._id}/assign`, {
        assignedRouteId: assignRouteId,
        currentBusRegistration: assignBusReg.toUpperCase().trim(),
      });
      if (res.status === 200 || res.status === 201) {
        setAssignSuccess("Duty shift details assigned successfully!");
        // Update selected driver locally
        setSelectedDriver((prev) =>
          prev
            ? {
                ...prev,
                assignedRouteId: assignRouteId,
                currentBusRegistration: assignBusReg.toUpperCase().trim(),
              }
            : null
        );
        fetchDrivers();
      }
    } catch (err: any) {
      console.error("Assign duty failed", err);
      setAssignError(err.response?.data?.message || "Failed to assign duty shift details.");
    } finally {
      setAssigningDuty(false);
    }
  };

  const filteredDrivers = drivers.filter((d) => {
    const term = searchQuery.toLowerCase();
    return (
      d.fullName.toLowerCase().includes(term) ||
      d.email.toLowerCase().includes(term) ||
      d.licenseNumber.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Upper header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[var(--color-on-surface)]">
            Driver Management Console
          </h2>
          <p className="text-sm text-muted mt-1">
            Register and monitor verified drivers in your transit company network.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing || loading}
            className="flex items-center gap-2 py-2.5 px-4 rounded-xl border border-[var(--color-outline-variant)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-variant)] text-xs font-bold text-[var(--color-on-surface)] cursor-pointer transition-all disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
            Sync
          </button>
          
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary py-2.5 px-5 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-500/10"
          >
            <UserPlus className="h-4 w-4" />
            Add New Driver
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid gap-8 lg:grid-cols-12">
        {/* Left main view: Drivers Table - 12 columns unless modal open, keep layout clean */}
        <div className="lg:col-span-12 space-y-6">
          <div className="card p-6 md:p-8 space-y-6">
            {/* Search and Filters Bar */}
            <div className="flex items-center gap-3 max-w-md w-full relative">
              <Search className="absolute left-3.5 h-4 w-4 text-muted pointer-events-none" />
              <input
                type="text"
                placeholder="Search drivers by name, email, or license..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--color-outline-variant)] bg-[var(--color-surface-variant)] text-xs text-[var(--color-on-surface)] focus:outline-none focus:border-indigo-500 transition-all placeholder:text-muted"
              />
            </div>

            {loading ? (
              <div className="py-20 flex justify-center">
                <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
              </div>
            ) : filteredDrivers.length === 0 ? (
              <div className="surface-variant py-20 flex flex-col items-center justify-center text-center px-4 rounded-2xl border border-[var(--color-outline-variant)]">
                <Users className="h-10 w-10 text-muted opacity-30 mb-4" />
                <p className="text-sm font-bold text-muted">No drivers registered yet</p>
                <p className="text-xs text-muted mt-1 max-w-sm leading-relaxed">
                  Start by adding your first driver to assign route telemetry shifts.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[var(--color-outline-variant)] text-[10px] font-bold text-muted uppercase tracking-wider">
                      <th className="pb-3 pl-2">Driver Info</th>
                      <th className="pb-3">License Number</th>
                      <th className="pb-3">Duty Status</th>
                      <th className="pb-3">Active Vehicle</th>
                      <th className="pb-3 text-right pr-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-outline-variant)]">
                    {filteredDrivers.map((driver) => (
                      <tr key={driver._id} className="text-xs hover:bg-[var(--color-surface-variant)]/40 transition-colors">
                        <td className="py-4 pl-2">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 font-bold">
                              {driver.fullName.charAt(0)}
                            </div>
                            <div>
                              <div className="font-bold text-[var(--color-on-surface)]">{driver.fullName}</div>
                              <div className="text-[10px] text-muted mt-0.5">{driver.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 font-mono font-medium text-muted">
                          {driver.licenseNumber}
                        </td>
                        <td className="py-4">
                          {driver.isOnShift ? (
                            <span className="inline-flex items-center gap-1 py-1 px-2.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500">
                              <CheckCircle className="h-3 w-3" />
                              Active On Shift
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 py-1 px-2.5 rounded-full text-[10px] font-bold bg-neutral-500/10 text-muted">
                              <Clock className="h-3 w-3" />
                              Off Duty
                            </span>
                          )}
                        </td>
                        <td className="py-4">
                          <div className="flex flex-col gap-0.5">
                            {driver.currentBusRegistration ? (
                              <span className="font-mono font-bold text-indigo-500">
                                {driver.currentBusRegistration}
                              </span>
                            ) : (
                              <span className="text-muted italic text-[11px]">No Bus Assigned</span>
                            )}
                            {driver.assignedRouteId && (
                              <span className="text-[10px] text-muted font-medium">
                                Route: {driver.assignedRouteId}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 text-right pr-2">
                          <button
                            onClick={() => {
                              setSelectedDriver(driver);
                              setAssignRouteId(driver.assignedRouteId || "");
                              setAssignBusReg(driver.currentBusRegistration || "");
                              setAssignSuccess("");
                              setAssignError("");
                            }}
                            className="text-xs text-indigo-500 hover:text-indigo-600 font-bold transition-colors cursor-pointer"
                          >
                            Manage Account
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Slide-over Modal for Registration */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md h-full bg-[var(--color-surface)] border-l border-[var(--color-outline-variant)] p-8 overflow-y-auto space-y-6 flex flex-col justify-between shadow-2xl">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-[var(--color-on-surface)]">
                  Register Driver Credentials
                </h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1.5 rounded-lg border border-[var(--color-outline-variant)] hover:bg-[var(--color-surface-variant)] text-muted cursor-pointer transition-colors"
                >
                  <XCircle className="h-4.5 w-4.5" />
                </button>
              </div>

              {errorMsg && (
                <div className="p-3.5 rounded-xl border border-red-500/20 bg-red-500/5 text-xs text-red-500 flex gap-2">
                  <XCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleRegisterDriver} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-muted uppercase tracking-widest">
                    Driver Full Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-[var(--color-outline-variant)] bg-[var(--color-surface-variant)] text-xs text-[var(--color-on-surface)] focus:outline-none focus:border-indigo-500 transition-all placeholder:text-muted"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-muted uppercase tracking-widest">
                    Email Address
                  </label>
                  <div className="relative flex items-center">
                    <Mail className="absolute left-3.5 h-4 w-4 text-muted pointer-events-none" />
                    <input
                      type="email"
                      required
                      placeholder="driver@transit.lk"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-[var(--color-outline-variant)] bg-[var(--color-surface-variant)] text-xs text-[var(--color-on-surface)] focus:outline-none focus:border-indigo-500 transition-all placeholder:text-muted"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-muted uppercase tracking-widest">
                    License Number (DL)
                  </label>
                  <div className="relative flex items-center">
                    <Shield className="absolute left-3.5 h-4 w-4 text-muted pointer-events-none" />
                    <input
                      type="text"
                      required
                      placeholder="LK-9834293"
                      value={licenseNumber}
                      onChange={(e) => setLicenseNumber(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-[var(--color-outline-variant)] bg-[var(--color-surface-variant)] text-xs text-[var(--color-on-surface)] focus:outline-none focus:border-indigo-500 transition-all placeholder:text-muted"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-muted uppercase tracking-widest">
                    Temporary Password (Optional)
                  </label>
                  <div className="relative flex items-center">
                    <Lock className="absolute left-3.5 h-4 w-4 text-muted pointer-events-none" />
                    <input
                      type="password"
                      placeholder="Default: driver123"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-[var(--color-outline-variant)] bg-[var(--color-surface-variant)] text-xs text-[var(--color-on-surface)] focus:outline-none focus:border-indigo-500 transition-all placeholder:text-muted"
                    />
                  </div>
                  <p className="text-[10px] text-muted">
                    Leave blank to use the system default temporary password.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full btn-primary py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-500/10 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    "Complete Registration"
                  )}
                </button>
              </form>
            </div>

            <div className="pt-6 border-t border-[var(--color-outline-variant)] text-[10px] text-muted leading-relaxed">
              Upon successful registration, drivers can verify shifts in the mobile application by logging in with their email and password credentials.
            </div>
          </div>
        </div>
      )}

      {/* Slide-over Modal for Managing Driver Account */}
      {selectedDriver && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md h-full bg-[var(--color-surface)] border-l border-[var(--color-outline-variant)] p-8 overflow-y-auto space-y-6 flex flex-col justify-between shadow-2xl">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-[var(--color-on-surface)]">
                  Driver Security & Metrics
                </h3>
                <button
                  onClick={() => {
                    setSelectedDriver(null);
                    setResetPasswordSuccess("");
                    setGeneratedPassword("");
                  }}
                  className="p-1.5 rounded-lg border border-[var(--color-outline-variant)] hover:bg-[var(--color-surface-variant)] text-muted cursor-pointer transition-colors"
                >
                  <XCircle className="h-4.5 w-4.5" />
                </button>
              </div>

              {/* Profile Card */}
              <div className="surface-variant p-5 rounded-2xl border border-[var(--color-outline-variant)] bg-[var(--color-surface-variant)]/20 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 font-bold text-xl">
                    {selectedDriver.fullName.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-[var(--color-on-surface)] text-sm">{selectedDriver.fullName}</h4>
                    <p className="text-xs text-muted mt-0.5">{selectedDriver.email}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] font-mono font-medium text-muted bg-[var(--color-surface)] px-2 py-0.5 rounded-md border border-[var(--color-outline-variant)]">
                        {selectedDriver.licenseNumber}
                      </span>
                      {selectedDriver.isOnShift ? (
                        <span className="inline-flex items-center gap-1 py-0.5 px-2 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-500">
                          <CheckCircle className="h-2.5 w-2.5" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 py-0.5 px-2 rounded-full text-[9px] font-bold bg-neutral-500/10 text-muted">
                          <Clock className="h-2.5 w-2.5" />
                          Off Duty
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="space-y-3">
                <h5 className="text-[10px] font-bold text-muted uppercase tracking-widest">
                  Live Analytics (Mocked)
                </h5>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border border-[var(--color-outline-variant)] bg-[var(--color-surface-variant)]/30 space-y-1">
                    <div className="flex items-center justify-between text-muted">
                      <span className="text-[10px]">Total Journeys</span>
                      <Activity className="h-3.5 w-3.5 text-indigo-500" />
                    </div>
                    <p className="text-lg font-mono font-bold text-[var(--color-on-surface)]">148</p>
                  </div>
                  <div className="p-4 rounded-xl border border-[var(--color-outline-variant)] bg-[var(--color-surface-variant)]/30 space-y-1">
                    <div className="flex items-center justify-between text-muted">
                      <span className="text-[10px]">Average Rating</span>
                      <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500/20" />
                    </div>
                    <p className="text-lg font-mono font-bold text-[var(--color-on-surface)]">4.9 ★</p>
                  </div>
                  <div className="p-4 rounded-xl border border-[var(--color-outline-variant)] bg-[var(--color-surface-variant)]/30 space-y-1">
                    <div className="flex items-center justify-between text-muted">
                      <span className="text-[10px]">Shift Hours</span>
                      <Clock className="h-3.5 w-3.5 text-emerald-500" />
                    </div>
                    <p className="text-lg font-mono font-bold text-[var(--color-on-surface)]">324 hrs</p>
                  </div>
                  <div className="p-4 rounded-xl border border-[var(--color-outline-variant)] bg-[var(--color-surface-variant)]/30 space-y-1">
                    <div className="flex items-center justify-between text-muted">
                      <span className="text-[10px]">Safety Rating</span>
                      <Award className="h-3.5 w-3.5 text-rose-500" />
                    </div>
                    <p className="text-lg font-mono font-bold text-[var(--color-on-surface)]">98%</p>
                  </div>
                </div>
              </div>

              {/* Route & Bus Duty Assignment Form */}
              <div className="space-y-4 pt-4 border-t border-[var(--color-outline-variant)]">
                <h5 className="text-[10px] font-bold text-muted uppercase tracking-widest flex items-center gap-1.5">
                  <Route className="h-3.5 w-3.5 text-indigo-500" />
                  Assign Bus & Route Duty
                </h5>

                {assignSuccess && (
                  <div className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-xs text-emerald-500">
                    {assignSuccess}
                  </div>
                )}
                {assignError && (
                  <div className="p-3.5 rounded-xl border border-rose-500/20 bg-rose-500/5 text-xs text-rose-500">
                    {assignError}
                  </div>
                )}

                <form onSubmit={handleAssignDuty} className="space-y-3.5">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold text-muted">
                      Select Assigned Transit Route
                    </label>
                    <select
                      value={assignRouteId}
                      onChange={(e) => setAssignRouteId(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--color-outline-variant)] bg-[var(--color-surface-variant)] text-xs text-[var(--color-on-surface)] focus:outline-none focus:border-indigo-500"
                      required
                    >
                      <option value="">-- Choose Route --</option>
                      {routes.map((r) => (
                        <option key={r.routeId} value={r.routeId}>
                          Route {r.routeId} - {r.routeName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold text-muted">
                      Bus Registration Number
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. CP-NA-5930"
                      value={assignBusReg}
                      onChange={(e) => setAssignBusReg(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--color-outline-variant)] bg-[var(--color-surface-variant)] text-xs text-[var(--color-on-surface)] font-mono focus:outline-none focus:border-indigo-500 uppercase"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={assigningDuty}
                    className="w-full btn-primary py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-indigo-500/10 disabled:opacity-50"
                  >
                    {assigningDuty ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : null}
                    Assign Duty
                  </button>
                </form>
              </div>

              {/* Administrative Actions */}
              <div className="space-y-4 pt-4 border-t border-[var(--color-outline-variant)]">
                <h5 className="text-[10px] font-bold text-muted uppercase tracking-widest">
                  Administrative Credentials Reset
                </h5>

                {resetPasswordSuccess && (
                  <div className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-xs text-emerald-500 space-y-2 animate-fade-in">
                    <div className="flex gap-2 items-center">
                      <CheckCircle className="h-4 w-4 shrink-0" />
                      <span className="font-bold">{resetPasswordSuccess}</span>
                    </div>
                    {generatedPassword && (
                      <div className="flex items-center justify-between bg-[var(--color-surface)] p-2 rounded-lg border border-[var(--color-outline-variant)] mt-1.5">
                        <code className="text-xs font-mono font-bold select-all">{generatedPassword}</code>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(generatedPassword);
                          }}
                          className="p-1 hover:bg-[var(--color-surface-variant)] rounded text-muted hover:text-[var(--color-on-surface)] transition-all cursor-pointer"
                          title="Copy Password"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <button
                  onClick={() => {
                    const newPass = `transit-drv-${Math.floor(1000 + Math.random() * 9000)}`;
                    setGeneratedPassword(newPass);
                    setResetPasswordSuccess("Password reset successfully! Share this new temporary credential:");
                  }}
                  className="w-full py-3 px-4 rounded-xl border border-[var(--color-outline-variant)] bg-[var(--color-surface-variant)] hover:bg-[var(--color-surface-variant)]/80 text-xs font-bold text-[var(--color-on-surface)] flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
                >
                  <Lock className="h-4 w-4 text-indigo-500" />
                  Generate New Temp Password
                </button>
              </div>
            </div>

            <div className="pt-6 border-t border-[var(--color-outline-variant)] text-[10px] text-muted leading-relaxed flex flex-col gap-2">
              <div>
                <strong>Duty Assignment:</strong> Drivers must log in on their mobile device and start their shift to register active vehicle GPS coordinates.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
