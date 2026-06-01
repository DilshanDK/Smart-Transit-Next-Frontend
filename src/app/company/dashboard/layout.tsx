"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/core/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import {
  Building2,
  LayoutDashboard,
  Bus,
  Users,
  Compass,
  BarChart3,
  DollarSign,
  LogOut,
  Menu,
  X,
  ShieldCheck
} from "lucide-react";
import Link from "next/link";
import ThemeToggle from "../../components/theme-toggle";

export default function CompanyDashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const { user, role, logout, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Security guard redirecting unauthorized users
  useEffect(() => {
    if (!loading) {
      if (!user || role !== "company") {
        router.push("/company/login");
      }
    }
  }, [user, role, loading, router]);

  if (loading || !user || role !== "company") {
    return (
      <div className="app-shell min-h-screen flex items-center justify-center bg-[var(--color-background)]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-indigo-500 bg-opacity-15 flex items-center justify-center animate-spin">
            <Building2 className="h-5 w-5 text-indigo-500" />
          </div>
          <span className="text-sm text-muted font-medium">Authorizing system credentials...</span>
        </div>
      </div>
    );
  }

  const navItems = [
    { label: "Overview", href: "/company/dashboard", icon: LayoutDashboard },
    { label: "Fleet Fleet", href: "/company/dashboard/fleet", icon: Bus },
    { label: "Drivers Staff", href: "/company/dashboard/drivers", icon: Users },
    { label: "Routes Map", href: "/company/dashboard/routes", icon: Compass },
    { label: "Reports Ledger", href: "/company/dashboard/reports", icon: BarChart3 },
    { label: "Stripe Connect", href: "/company/dashboard/stripe", icon: DollarSign }
  ];

  const handleLogout = async () => {
    if (confirm("Are you sure you want to log out of the Operations Console?")) {
      await logout();
      router.push("/company/login");
    }
  };

  return (
    <div className="app-shell min-h-screen flex flex-col md:flex-row bg-[var(--color-background)]">
      {/* Mobile Header */}
      <header className="md:hidden border-b border-[var(--color-outline-variant)] bg-[var(--color-surface)] px-6 py-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <Building2 className="h-5 w-5 text-indigo-500" />
          <span className="font-extrabold text-sm tracking-tight text-[var(--color-on-surface)]">
            Operations Console
          </span>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-muted hover:text-[var(--color-on-surface)] transition-colors cursor-pointer"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {/* Sidebar Sidebar */}
      <aside
        className={`md:flex flex-col w-full md:w-64 border-r border-[var(--color-outline-variant)] bg-[var(--color-surface)] px-4 py-6 sticky top-0 h-screen z-30 transition-transform duration-300 md:translate-x-0 ${
          mobileMenuOpen ? "block fixed inset-0 top-[60px] h-[calc(100vh-60px)]" : "hidden"
        }`}
      >
        {/* Brand logo */}
        <div className="hidden md:flex items-center gap-3 px-3 mb-8">
          <div className="h-9 w-9 rounded-xl bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/10">
            <Building2 className="h-4.5 w-4.5 text-white" />
          </div>
          <div>
            <p className="text-xs text-muted font-bold tracking-widest uppercase">Smart Transit</p>
            <h1 className="text-base font-extrabold tracking-tight text-[var(--color-on-surface)]">
              Ops Console
            </h1>
          </div>
        </div>

        {/* Company info card */}
        <div className="surface-variant p-4 mb-6 flex flex-col gap-2 rounded-xl">
          <div className="flex items-center gap-1 text-[9px] font-bold text-indigo-500 uppercase tracking-widest">
            <ShieldCheck className="h-3 w-3" />
            Verified Enterprise
          </div>
          <div>
            <p className="font-bold text-sm truncate text-[var(--color-on-surface)]">
              {(user as any)?.companyName || "Bus Transport Company"}
            </p>
            <p className="text-xs text-muted truncate mt-0.5">{user.email}</p>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 space-y-1.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`nav-item ${isActive ? "active" : ""}`}
              >
                <Icon className="h-4.5 w-4.5 shrink-0" />
                <span className="text-sm font-semibold">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer actions */}
        <div className="pt-4 border-t border-[var(--color-outline-variant)] space-y-3">
          <div className="hidden md:flex items-center justify-between px-3">
            <span className="text-xs text-muted">Contrast Mode</span>
            <ThemeToggle />
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-500 hover:bg-red-500/5 hover:text-red-600 transition-all font-semibold text-sm cursor-pointer"
          >
            <LogOut className="h-4.5 w-4.5" />
            <span>Terminate Session</span>
          </button>
        </div>
      </aside>

      {/* Main viewport */}
      <main className="flex-1 p-6 md:p-8 lg:p-10 max-w-6xl mx-auto w-full overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
