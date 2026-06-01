'use client';

import React, { useState } from 'react';
import { useAuth } from '@/core/context/AuthContext';
import { LayoutDashboard, History, Wallet, User, LogOut, Menu, X, Bus } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ThemeToggle from '../../components/theme-toggle';

export default function PassengerDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout, loading } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (loading) {
    return (
      <div className="app-shell min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-[var(--color-primary)] bg-opacity-15 flex items-center justify-center animate-spin">
            <Bus className="h-5 w-5 text-[var(--color-primary)]" />
          </div>
          <span className="text-sm text-muted font-medium">Synchronizing profile...</span>
        </div>
      </div>
    );
  }

  const navItems = [
    { label: 'Overview', href: '/passenger/dashboard', icon: LayoutDashboard },
    { label: 'Journeys', href: '/passenger/dashboard/journeys', icon: History },
    { label: 'Wallet', href: '/passenger/dashboard/wallet', icon: Wallet },
    { label: 'Profile', href: '/passenger/dashboard/profile', icon: User },
  ];

  const handleLogout = async () => {
    if (confirm('Are you sure you want to end your session?')) {
      await logout();
    }
  };

  return (
    <div className="app-shell min-h-screen flex flex-col md:flex-row">
      {/* Mobile Top Bar */}
      <header className="md:hidden border-b border-[var(--color-outline-variant)] bg-[var(--color-surface)] px-6 py-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <span className="brand-dot" />
          <span className="font-bold text-sm tracking-wide">TransitFlow</span>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-muted hover:text-[var(--color-on-surface)] transition-colors">
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {/* Sidebar (Desktop) */}
      <aside className={`md:flex flex-col w-full md:w-64 border-r border-[var(--color-outline-variant)] bg-[var(--color-surface)] px-4 py-6 sticky top-0 h-screen z-30 transition-transform duration-300 md:translate-x-0 ${
        mobileMenuOpen ? 'block fixed inset-0 top-[60px] h-[calc(100vh-60px)]' : 'hidden'
      }`}>
        {/* Brand */}
        <div className="hidden md:flex items-center gap-3 px-3 mb-8">
          <div className="h-9 w-9 rounded-xl bg-[var(--color-primary)] flex items-center justify-center">
            <Bus className="h-4.5 w-4.5 text-white" />
          </div>
          <div>
            <p className="text-xs text-muted font-bold tracking-widest uppercase">Smart Transit</p>
            <h1 className="text-base font-bold tracking-tight text-[var(--color-on-surface)]">Passenger</h1>
          </div>
        </div>

        {/* User Card */}
        {user && (
          <div className="surface-variant p-4 mb-6 flex flex-col gap-2">
            <p className="text-xs text-muted font-semibold tracking-wide uppercase">Active Account</p>
            <div>
              <p className="font-bold text-sm truncate">{user.fullName}</p>
              <p className="text-xs text-muted truncate mt-0.5">{user.email}</p>
            </div>
            {user.walletBalance !== undefined && (
              <div className="mt-2 pt-2 border-t border-[var(--color-outline-variant)] flex items-center justify-between">
                <span className="text-xs text-muted">Wallet Balance:</span>
                <span className="text-xs font-bold text-[var(--color-primary)]">LKR {user.walletBalance.toFixed(2)}</span>
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 space-y-1.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`nav-item ${isActive ? 'active' : ''}`}
              >
                <Icon className="h-4.5 w-4.5" />
                <span className="text-sm font-semibold">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer controls */}
        <div className="pt-4 border-t border-[var(--color-outline-variant)] space-y-3">
          <div className="hidden md:flex items-center justify-between px-3">
            <span className="text-xs text-muted">Dark Mode</span>
            <ThemeToggle />
          </div>
          
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-500 hover:bg-red-500/5 hover:text-red-600 transition-all font-semibold text-sm cursor-pointer"
          >
            <LogOut className="h-4.5 w-4.5" />
            <span>End Session</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-8 lg:p-10 max-w-6xl mx-auto w-full overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
