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
  ShieldCheck,
  Bell,
  Clock,
  ChevronRight
} from "lucide-react";
import Link from "next/link";
import ThemeToggle from "../../components/theme-toggle";
import ConfirmModal from "../../components/confirm-modal";

export default function CompanyDashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const { user, role, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [localTime, setLocalTime] = useState("");

  // Update live clock
  useEffect(() => {
    const updateTime = () => {
      const date = new Date();
      setLocalTime(date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    };
    updateTime();
    const timer = setInterval(updateTime, 60000);
    return () => clearInterval(timer);
  }, []);

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
      <div className="app-shell min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-teal-400 flex items-center justify-center animate-spin shadow-lg">
            <Building2 className="h-5 w-5 text-white" />
          </div>
          <span className="text-sm text-muted font-medium">Authorizing enterprise credentials...</span>
        </div>
      </div>
    );
  }

  const navItems = [
    { label: "Overview", href: "/company/dashboard", icon: LayoutDashboard },
    { label: "Fleet", href: "/company/dashboard/fleet", icon: Bus },
    { label: "Drivers", href: "/company/dashboard/drivers", icon: Users },
    { label: "Routes Map", href: "/company/dashboard/routes", icon: Compass },
    { label: "Reports Ledger", href: "/company/dashboard/reports", icon: BarChart3 },
    { label: "Stripe Connect", href: "/company/dashboard/stripe", icon: DollarSign }
  ];

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await logout();
    router.push("/login");
  };

  const getPageTitle = () => {
    const active = navItems.find((n) => pathname === n.href);
    return active ? active.label : "Ops Console";
  };

  return (
    <div className="app-shell min-h-screen flex flex-col md:flex-row bg-[var(--color-bg)]">
      
      {/* Mobile Top Bar */}
      <header className="md:hidden border-b border-[var(--color-outline-variant)] bg-[var(--color-surface)] px-6 py-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-lg bg-gradient-to-tr from-indigo-500 to-teal-400 flex items-center justify-center shadow">
            <Building2 className="h-4 w-4 text-white" />
          </div>
          <span className="font-extrabold text-sm tracking-tight text-[var(--color-on-surface)] bg-gradient-to-r from-indigo-400 to-teal-400 bg-clip-text text-transparent">
            TransitOps
          </span>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
            className="text-muted hover:text-[var(--color-on-surface)] transition-colors focus:outline-none"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {/* Sidebar (Desktop - Matching design template structure) */}
      <aside className={`md:flex flex-col w-full md:w-64 border-r border-[var(--color-outline-variant)] bg-[var(--color-surface)] px-4 py-6 sticky top-0 h-screen z-30 transition-transform duration-300 md:translate-x-0 ${
        mobileMenuOpen ? 'block fixed inset-0 top-[60px] h-[calc(100vh-60px)]' : 'hidden'
      }`}>
        
        {/* Brand logo header */}
        <div className="hidden md:flex items-center gap-3 px-3 mb-6">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-teal-400 flex items-center justify-center shadow-lg shadow-indigo-500/10">
            <Building2 className="h-4.5 w-4.5 text-white" />
          </div>
          <div>
            <span className="font-black text-sm tracking-tight text-[var(--color-on-surface)] bg-gradient-to-r from-indigo-400 to-teal-400 bg-clip-text text-transparent">
              TransitOps
            </span>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Enterprise Hub</p>
          </div>
        </div>

        {/* Company Quick badge card */}
        <div className="bg-[var(--color-surface-variant)] border border-[var(--color-outline-variant)] p-3.5 mb-6 flex flex-col gap-1.5 rounded-2xl">
          <div className="flex items-center gap-1.5 text-[9px] font-extrabold text-indigo-400 uppercase tracking-widest">
            <ShieldCheck className="h-3.5 w-3.5" />
            Verified operator
          </div>
          <div className="min-w-0">
            <p className="font-extrabold text-xs text-[var(--color-on-surface)] truncate">
              {(user as any)?.companyName || "Bus Operations Co."}
            </p>
            <p className="text-[10px] text-slate-400 truncate mt-0.5">{user.email}</p>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 space-y-1.5 px-1">
          <span className="text-[10px] text-muted font-bold tracking-wider uppercase block px-3 mb-3">Management</span>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all duration-200 border border-transparent ${
                  isActive 
                    ? 'bg-gradient-to-tr from-indigo-500/10 to-teal-500/10 text-indigo-400 border-indigo-500/20 shadow-sm' 
                    : 'text-muted hover:text-[var(--color-on-surface)] hover:bg-[var(--color-surface-variant)]'
                }`}
              >
                <Icon className={`h-4.5 w-4.5 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer actions */}
        <div className="pt-4 border-t border-[var(--color-outline-variant)] flex flex-col gap-4">
          <div className="flex items-center justify-between px-2">
            {/* Notification alert trigger */}
            <button className="relative p-2.5 rounded-xl bg-[var(--color-surface-variant)] border border-[var(--color-outline-variant)] text-muted hover:text-[var(--color-on-surface)] transition-all cursor-pointer">
              <Bell className="h-4.5 w-4.5" />
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-teal-400 animate-pulse" />
            </button>

            {/* Live Clock / Theme Toggle capsule */}
            <div className="flex items-center gap-1.5">
              <ThemeToggle />
            </div>
          </div>

          {/* User Account Capsule */}
          {user && (
            <div className="flex items-center gap-3 p-2 bg-[var(--color-surface-variant)] border border-[var(--color-outline-variant)] rounded-2xl relative group">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-teal-400 flex items-center justify-center text-white text-xs font-black shadow-md shrink-0">
                {((user as any)?.companyName || 'CO').split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
              </div>
              <div className="min-w-0 flex-1 text-left">
                <p className="text-xs font-black text-[var(--color-on-surface)] truncate">{(user as any)?.companyName || "Operations Co."}</p>
                <p className="text-[9px] text-slate-400 truncate mt-0.5">Control Center</p>
              </div>
              
              {/* Dropdown overlay menu */}
              <div className="absolute left-0 bottom-14 w-52 card p-3 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all shadow-2xl z-50 bg-[var(--color-surface)] border border-[var(--color-outline-variant)]">
                <p className="font-extrabold text-xs text-[var(--color-on-surface)] border-b border-[var(--color-outline-variant)] pb-2 mb-2">{(user as any)?.companyName || "Operations Co."}</p>
                
                <div className="flex flex-col gap-1.5 py-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Account:</span>
                    <span className="font-bold text-teal-400">Enterprise</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Owner:</span>
                    <span className="font-bold text-[var(--color-on-surface)] truncate max-w-[100px]">{user.fullName || "Operator"}</span>
                  </div>
                </div>

                <button
                  onClick={() => setIsLogoutModalOpen(true)}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-red-500 hover:bg-red-500/5 hover:text-red-600 transition-all font-bold text-xs mt-2 cursor-pointer border border-transparent hover:border-red-500/10"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Log Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main View Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Top Header Bar (Desktop only) */}
        <header className="hidden md:flex items-center justify-between px-8 py-5 bg-[var(--color-surface)] bg-opacity-40 backdrop-blur-md border-b border-[var(--color-outline-variant)]">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Enterprise Console</span>
            <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-sm font-black text-[var(--color-on-surface)]">{getPageTitle()}</span>
          </div>

          <div className="flex items-center gap-6">
            {/* Live Clock */}
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 bg-[var(--color-surface-variant)] px-3 py-1.5 rounded-xl border border-[var(--color-outline-variant)]">
              <Clock className="h-3.5 w-3.5" />
              <span>{localTime || "--:--"}</span>
            </div>

            {/* Quick Status */}
            <div className="flex items-center gap-2 text-xs font-bold text-teal-400 bg-teal-500/5 px-3.5 py-1.5 rounded-xl border border-teal-500/10 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-teal-400 animate-pulse" />
              <span>Console Connected</span>
            </div>
          </div>
        </header>

        {/* Scrollable Viewport */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 lg:p-10 max-w-6xl w-full mx-auto">
          {children}
        </main>
      </div>

      <ConfirmModal
        isOpen={isLogoutModalOpen}
        title="End Session"
        message="Are you sure you want to log out of your ops console?"
        confirmText="Log Out"
        isDangerous={true}
        isLoading={isLoggingOut}
        onConfirm={handleLogout}
        onCancel={() => setIsLogoutModalOpen(false)}
      />
    </div>
  );
}
