"use client";

import React, { useState } from "react";
import { useAuth } from "@/core/context/AuthContext";
import { apiClient } from "@/core/lib/api-client";
import {
  User,
  Mail,
  Lock,
  CheckCircle,
  AlertCircle,
  Key,
  Shield,
  CreditCard,
  Calendar,
  Smartphone,
  Save,
  CheckCircle2
} from "lucide-react";

export default function ProfilePage() {
  const { user, refreshProfile } = useAuth();
  
  // Profile Info state
  const [fullName, setFullName] = useState(user?.fullName || "");
  const [email, setEmail] = useState(user?.email || "");
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingProfile(true);
    setProfileSuccess(null);
    setProfileError(null);

    try {
      const res = await apiClient.patch("/auth/profile", {
        fullName,
        email
      });

      if (res.status === 200) {
        setProfileSuccess("Your profile details have been successfully updated.");
        await refreshProfile();
        setTimeout(() => setProfileSuccess(null), 5000);
      }
    } catch (err: any) {
      setProfileError(err.response?.data?.message || "Failed to update profile information");
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    setLoadingPassword(true);
    setPasswordSuccess(null);
    setPasswordError(null);

    try {
      const res = await apiClient.patch("/auth/profile", {
        currentPassword,
        newPassword
      });

      if (res.status === 200) {
        setPasswordSuccess("Password updated successfully.");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => setPasswordSuccess(null), 5000);
      }
    } catch (err: any) {
      setPasswordError(err.response?.data?.message || "Failed to change password. Please verify your credentials.");
    } finally {
      setLoadingPassword(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Account Profile</h2>
        <p className="text-sm text-muted mt-1">Configure your personal information and authentication settings.</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Left Form: Edit Details - 7 cols */}
        <div className="lg:col-span-7 space-y-6">
          {/* Personal Info Card */}
          <div className="card p-6 md:p-8 space-y-6">
            <h3 className="text-base font-bold tracking-tight flex items-center gap-2">
              <User className="h-4.5 w-4.5 text-[var(--color-primary)]" />
              Personal Particulars
            </h3>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted uppercase tracking-wider">Full Legal Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-[var(--color-outline-variant)] bg-[var(--color-surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-[var(--color-on-surface)]"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-muted uppercase tracking-wider">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-[var(--color-outline-variant)] bg-[var(--color-surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-[var(--color-on-surface)]"
                  />
                </div>
              </div>

              {profileSuccess && (
                <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-emerald-500 flex gap-3 text-xs">
                  <CheckCircle className="h-4.5 w-4.5 shrink-0" />
                  <span>{profileSuccess}</span>
                </div>
              )}

              {profileError && (
                <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-red-500 flex gap-3 text-xs">
                  <AlertCircle className="h-4.5 w-4.5 shrink-0" />
                  <span>{profileError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loadingProfile}
                className="btn-primary py-3 px-5 rounded-xl font-bold text-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loadingProfile ? (
                  <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Account Changes
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Change Password Card */}
          <div className="card p-6 md:p-8 space-y-6">
            <h3 className="text-base font-bold tracking-tight flex items-center gap-2">
              <Key className="h-4.5 w-4.5 text-[var(--color-primary)]" />
              Change Security Password
            </h3>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted uppercase tracking-wider">Current Security Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-[var(--color-outline-variant)] bg-[var(--color-surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-[var(--color-on-surface)]"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted uppercase tracking-wider">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min. 8 characters"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-[var(--color-outline-variant)] bg-[var(--color-surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-[var(--color-on-surface)]"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted uppercase tracking-wider">Confirm New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat password"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-[var(--color-outline-variant)] bg-[var(--color-surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-[var(--color-on-surface)]"
                    />
                  </div>
                </div>
              </div>

              {passwordSuccess && (
                <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-emerald-500 flex gap-3 text-xs">
                  <CheckCircle2 className="h-4.5 w-4.5 shrink-0" />
                  <span>{passwordSuccess}</span>
                </div>
              )}

              {passwordError && (
                <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-red-500 flex gap-3 text-xs">
                  <AlertCircle className="h-4.5 w-4.5 shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loadingPassword}
                className="btn-primary py-3 px-5 rounded-xl font-bold text-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loadingPassword ? (
                  <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Key className="h-4 w-4" />
                    Modify Account Password
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right Side: Metadata / Summary Info - 5 cols */}
        <div className="lg:col-span-5 space-y-6">
          {/* Identity Credentials */}
          <div className="card p-6 md:p-8 space-y-6">
            <h3 className="text-base font-bold tracking-tight">Identity Metadata</h3>

            <div className="space-y-4">
              {/* Account Status */}
              <div className="flex justify-between items-center py-2.5 border-b border-[var(--color-outline-variant)]">
                <span className="text-xs font-bold text-muted flex items-center gap-1.5">
                  <Shield className="h-4 w-4 text-[var(--color-primary)]" />
                  Security Clearance
                </span>
                <span className="text-[10px] font-extrabold uppercase tracking-wide bg-emerald-500/10 text-emerald-500 px-2.5 py-0.5 rounded border border-emerald-500/20">
                  Verified Passenger
                </span>
              </div>

              {/* NFC Chip details */}
              <div className="flex justify-between items-center py-2.5 border-b border-[var(--color-outline-variant)]">
                <span className="text-xs font-bold text-muted flex items-center gap-1.5">
                  <CreditCard className="h-4 w-4 text-[var(--color-primary)]" />
                  Smart NFC UID
                </span>
                <span className="text-xs font-mono font-bold text-[var(--color-on-surface)]">
                  {user?.nfcUid ? user.nfcUid.toUpperCase() : "UNLINKED_CHIP_SLOT"}
                </span>
              </div>

              {/* Joined Date */}
              <div className="flex justify-between items-center py-2.5 border-b border-[var(--color-outline-variant)]">
                <span className="text-xs font-bold text-muted flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-[var(--color-primary)]" />
                  Registration Date
                </span>
                <span className="text-xs font-bold text-[var(--color-on-surface)]">
                  May 2026
                </span>
              </div>
            </div>
          </div>

          {/* Wallet Summary Widget */}
          <div className="card p-6 md:p-8 space-y-4">
            <h3 className="text-base font-bold tracking-tight">Active Balance Summary</h3>
            <p className="text-[11px] text-muted leading-relaxed">
              Your prepaid account is linked directly to your contactless smart card. Funds are processed in real-time upon boarding a transit vehicle.
            </p>
            <div className="pt-2">
              <div className="text-2xl font-black text-[var(--color-primary)]">
                LKR {user?.walletBalance !== undefined ? parseFloat(String((user as any).walletBalance?.$numberDecimal ?? (user as any).walletBalance ?? 0)).toFixed(2) : "0.00"}
              </div>
              <span className="text-[9px] font-bold text-muted uppercase tracking-wider block mt-1">
                Available Credits
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
