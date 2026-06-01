'use client';

import React, { useState } from 'react';
import { 
  Bus, 
  Train, 
  MapPin, 
  Search, 
  Clock, 
  Leaf, 
  Shield, 
  CreditCard, 
  Bell, 
  ArrowRight, 
  ChevronRight, 
  Menu, 
  X,
  Compass
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import ThemeToggle from './components/theme-toggle';

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [fromLocation, setFromLocation] = useState('');
  const [toLocation, setToLocation] = useState('');

  return (
    <div className="app-shell min-h-screen flex flex-col bg-[var(--color-bg)]">
      
      {/* 1. Header (Navbar) */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[var(--color-surface)] bg-opacity-90 border-b border-[var(--color-outline-variant)]">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-[var(--color-primary)] flex items-center justify-center">
              <Bus className="h-5 w-5 text-white" />
            </div>
            <span className="font-extrabold text-xl tracking-tight text-[var(--color-on-surface)]">
              TransitFlow
            </span>
          </Link>

          {/* Navigation Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-8">
            <Link href="#schedules" className="text-sm font-semibold text-muted hover:text-[var(--color-on-surface)] transition-colors">
              Schedules
            </Link>
            <Link href="#routes" className="text-sm font-semibold text-muted hover:text-[var(--color-on-surface)] transition-colors">
              Routes
            </Link>
            <Link href="#pricing" className="text-sm font-semibold text-muted hover:text-[var(--color-on-surface)] transition-colors">
              Pricing
            </Link>
            <Link href="#about" className="text-sm font-semibold text-muted hover:text-[var(--color-on-surface)] transition-colors">
              About
            </Link>
          </nav>

          {/* Right Action buttons */}
          <div className="hidden md:flex items-center gap-4">
            <ThemeToggle />
            <Link href="/passenger/login" className="bg-[var(--color-primary)] hover:opacity-90 text-white font-bold text-sm px-6 py-2.5 rounded-full shadow-sm transition-all text-center">
              Sign In
            </Link>
          </div>

          {/* Mobile Menu Controls */}
          <div className="md:hidden flex items-center gap-3">
            <ThemeToggle />
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-muted hover:text-[var(--color-on-surface)] transition-colors"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[var(--color-outline-variant)] bg-[var(--color-surface)] px-6 py-4 flex flex-col gap-4 animate-fade-in">
            <Link href="#schedules" onClick={() => setMobileMenuOpen(false)} className="text-sm font-bold text-muted py-2">
              Schedules
            </Link>
            <Link href="#routes" onClick={() => setMobileMenuOpen(false)} className="text-sm font-bold text-muted py-2">
              Routes
            </Link>
            <Link href="#pricing" onClick={() => setMobileMenuOpen(false)} className="text-sm font-bold text-muted py-2">
              Pricing
            </Link>
            <Link href="#about" onClick={() => setMobileMenuOpen(false)} className="text-sm font-bold text-muted py-2">
              About
            </Link>
            <Link href="/passenger/login" onClick={() => setMobileMenuOpen(false)} className="bg-[var(--color-primary)] text-white text-center font-bold py-3 rounded-xl mt-2 block">
              Sign In
            </Link>
          </div>
        )}
      </header>

      {/* 2. Hero Section */}
      <section className="relative overflow-hidden border-b border-[var(--color-outline-variant)] bg-linear-to-b from-[var(--color-surface)] to-[var(--color-bg)]">
        {/* Background Blur Elements */}
        <div className="absolute top-[10%] left-[-15%] w-[45%] h-[45%] rounded-full bg-[var(--color-primary)] opacity-5 blur-[120px] pointer-events-none" />
        
        <div className="max-w-6xl mx-auto px-6 py-12 md:py-20 lg:py-24 grid gap-12 lg:grid-cols-12 items-center relative z-10">
          {/* Hero Left Content */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-primary)] bg-opacity-10 border border-[var(--color-primary)] border-opacity-20">
              <span className="h-2 w-2 rounded-full bg-[var(--color-primary)]" />
              <span className="text-xs font-bold text-[var(--color-primary)] tracking-wide">Transit Feature</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-[var(--color-on-surface)] leading-[1.1]">
              Smarter journeys for a connected city.
            </h1>
            
            <p className="text-base md:text-lg text-muted max-w-xl leading-relaxed">
              Experience seamless, eco-friendly travel across our unified network of buses, trains, and metros. Plan, track, and tap with TransitFlow.
            </p>
          </div>

          {/* Hero Right Plan Card */}
          <div className="lg:col-span-5">
            <div className="card p-6 md:p-8 backdrop-blur-md bg-opacity-95 shadow-xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-8 w-8 rounded-lg bg-[var(--color-primary)] bg-opacity-10 flex items-center justify-center">
                  <Compass className="h-4.5 w-4.5 text-[var(--color-primary)]" />
                </div>
                <h3 className="font-bold text-lg text-[var(--color-on-surface)]">Plan Your Journey</h3>
              </div>

              <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
                {/* From Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted block">From</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted">
                      <MapPin className="h-4 w-4" />
                    </span>
                    <input 
                      type="text" 
                      value={fromLocation}
                      onChange={(e) => setFromLocation(e.target.value)}
                      placeholder="Current Location"
                      className="w-full pl-10 pr-4 py-3 bg-[var(--color-surface-variant)] border border-[var(--color-outline-variant)] rounded-xl text-sm focus:outline-none focus:border-[var(--color-primary)] transition-all"
                    />
                  </div>
                </div>

                {/* To Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted block">To</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted">
                      <Search className="h-4 w-4" />
                    </span>
                    <input 
                      type="text" 
                      value={toLocation}
                      onChange={(e) => setToLocation(e.target.value)}
                      placeholder="Destination"
                      className="w-full pl-10 pr-4 py-3 bg-[var(--color-surface-variant)] border border-[var(--color-outline-variant)] rounded-xl text-sm focus:outline-none focus:border-[var(--color-primary)] transition-all"
                    />
                  </div>
                </div>

                {/* Depart time */}
                <div className="flex items-center gap-3 px-3.5 py-3 bg-[var(--color-surface-variant)] border border-[var(--color-outline-variant)] rounded-xl text-sm cursor-pointer hover:bg-opacity-80 transition-all">
                  <Clock className="h-4 w-4 text-muted" />
                  <span className="text-sm font-semibold text-[var(--color-on-surface)]">Depart Now</span>
                </div>

                {/* Submit button */}
                <button 
                  type="submit"
                  className="w-full btn-primary py-3.5 rounded-xl flex items-center justify-center gap-2 cursor-pointer text-sm shadow-md mt-6"
                >
                  <Search className="h-4 w-4" />
                  <span>Find Routes</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Why Choose TransitFlow Section */}
      <section className="py-16 md:py-24 max-w-6xl mx-auto px-6 w-full space-y-12">
        <div className="text-center space-y-3">
          <h2 className="text-3xl font-extrabold tracking-tight">Why Choose TransitFlow</h2>
          <p className="text-sm text-muted">Designed for speed, reliability, and sustainability.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Card 1 */}
          <div className="card p-6 md:p-8 text-center flex flex-col items-center gap-4 transition-all duration-300 hover:shadow-md">
            <div className="h-12 w-12 rounded-full bg-[var(--color-primary)] bg-opacity-10 flex items-center justify-center border border-[var(--color-primary)] border-opacity-20 text-[var(--color-primary)]">
              <Clock className="h-5.5 w-5.5" />
            </div>
            <h3 className="font-bold text-lg text-[var(--color-on-surface)]">Fast & Reliable</h3>
            <p className="text-sm text-muted leading-relaxed">
              Optimized routes and real-time adjustments ensure you reach your destination without delays.
            </p>
          </div>

          {/* Card 2 */}
          <div className="card p-6 md:p-8 text-center flex flex-col items-center gap-4 transition-all duration-300 hover:shadow-md">
            <div className="h-12 w-12 rounded-full bg-[var(--color-primary)] bg-opacity-10 flex items-center justify-center border border-[var(--color-primary)] border-opacity-20 text-[var(--color-primary)]">
              <Leaf className="h-5.5 w-5.5" />
            </div>
            <h3 className="font-bold text-lg text-[var(--color-on-surface)]">Eco-Friendly</h3>
            <p className="text-sm text-muted leading-relaxed">
              Travel green with our 100% electric and low-emission fleet, reducing the city's carbon footprint.
            </p>
          </div>

          {/* Card 3 */}
          <div className="card p-6 md:p-8 text-center flex flex-col items-center gap-4 transition-all duration-300 hover:shadow-md">
            <div className="h-12 w-12 rounded-full bg-[var(--color-primary)] bg-opacity-10 flex items-center justify-center border border-[var(--color-primary)] border-opacity-20 text-[var(--color-primary)]">
              <Shield className="h-5.5 w-5.5" />
            </div>
            <h3 className="font-bold text-lg text-[var(--color-on-surface)]">Safe & Secure</h3>
            <p className="text-sm text-muted leading-relaxed">
              Modern vehicles, well-lit stations, and 24/7 real-time tracking for your peace of mind.
            </p>
          </div>
        </div>
      </section>

      {/* 4. Our Services Section */}
      <section className="py-16 md:py-24 border-t border-[var(--color-outline-variant)] bg-[var(--color-surface)]">
        <div className="max-w-6xl mx-auto px-6 w-full space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-extrabold tracking-tight">Our Services</h2>
            <p className="text-sm text-muted">Explore all the ways we connect the city.</p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {/* Bus Service */}
            <div className="card overflow-hidden flex flex-col h-full bg-[var(--color-bg)]">
              <div className="relative h-48 w-full">
                <Image 
                  src="/bus.png" 
                  alt="Transit Bus Service" 
                  fill 
                  sizes="(max-w-768px) 100vw, 33vw"
                  className="object-cover"
                />
              </div>
              <div className="p-6 flex flex-col flex-1 justify-between gap-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-lg text-[var(--color-on-surface)]">Bus</h3>
                    <div className="h-6 w-6 rounded-full bg-[var(--color-primary)] bg-opacity-15 flex items-center justify-center text-[var(--color-primary)]">
                      <ChevronRight className="h-4 w-4" />
                    </div>
                  </div>
                  <p className="text-sm text-muted leading-relaxed">
                    Extensive network covering all major neighborhoods and commercial districts.
                  </p>
                </div>
                <button className="btn-outline w-full py-2.5 rounded-xl text-sm">
                  Learn More
                </button>
              </div>
            </div>

            {/* Train Service */}
            <div className="card overflow-hidden flex flex-col h-full bg-[var(--color-bg)]">
              <div className="relative h-48 w-full">
                <Image 
                  src="/train.png" 
                  alt="Regional Train Service" 
                  fill 
                  sizes="(max-w-768px) 100vw, 33vw"
                  className="object-cover"
                />
              </div>
              <div className="p-6 flex flex-col flex-1 justify-between gap-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-lg text-[var(--color-on-surface)]">Train</h3>
                    <div className="h-6 w-6 rounded-full bg-[var(--color-primary)] bg-opacity-15 flex items-center justify-center text-[var(--color-primary)]">
                      <ChevronRight className="h-4 w-4" />
                    </div>
                  </div>
                  <p className="text-sm text-muted leading-relaxed">
                    Fast regional connections linking suburbs to the downtown core.
                  </p>
                </div>
                <button className="btn-outline w-full py-2.5 rounded-xl text-sm">
                  Learn More
                </button>
              </div>
            </div>

            {/* Metro Service */}
            <div className="card overflow-hidden flex flex-col h-full bg-[var(--color-bg)]">
              <div className="relative h-48 w-full">
                <Image 
                  src="/metro.png" 
                  alt="City Metro Subway" 
                  fill 
                  sizes="(max-w-768px) 100vw, 33vw"
                  className="object-cover"
                />
              </div>
              <div className="p-6 flex flex-col flex-1 justify-between gap-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-lg text-[var(--color-on-surface)]">Metro</h3>
                    <div className="h-6 w-6 rounded-full bg-[var(--color-primary)] bg-opacity-15 flex items-center justify-center text-[var(--color-primary)]">
                      <ChevronRight className="h-4 w-4" />
                    </div>
                  </div>
                  <p className="text-sm text-muted leading-relaxed">
                    High-frequency underground transit for avoiding street-level traffic.
                  </p>
                </div>
                <button className="btn-outline w-full py-2.5 rounded-xl text-sm">
                  Learn More
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. TransitFlow Plus Contactless Card Section */}
      <section className="py-16 md:py-24 max-w-6xl mx-auto px-6 w-full grid gap-12 md:grid-cols-12 items-center">
        {/* Card Graphics Area */}
        <div className="md:col-span-5 flex justify-center">
          <div className="w-80 h-48 rounded-2xl bg-gradient-to-br from-[#1e293b] via-[#0f172a] to-[#1e1b4b] border border-slate-800 p-6 flex flex-col justify-between shadow-2xl relative overflow-hidden group">
            {/* Wave glow */}
            <div className="absolute right-[-20%] bottom-[-20%] w-48 h-48 rounded-full bg-[var(--color-primary)] opacity-10 blur-xl group-hover:opacity-15 transition-opacity" />
            
            <div className="flex justify-between items-start">
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Smart Transit Pass</span>
                <span className="text-base font-extrabold text-white mt-1">TransitFlow Plus</span>
              </div>
              <div className="flex items-center gap-1.5 bg-emerald-500 bg-opacity-10 border border-emerald-500 border-opacity-20 px-2 py-0.5 rounded text-[9px] font-bold text-emerald-400">
                Contactless
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-semibold block uppercase tracking-wide">Card Number</span>
                <span className="text-sm font-mono tracking-widest text-white">••••  ••••  ••••  4289</span>
              </div>
              <div className="h-8 w-8 rounded-full bg-white bg-opacity-5 flex items-center justify-center">
                <CreditCard className="h-4.5 w-4.5 text-slate-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Info Area */}
        <div className="md:col-span-7 space-y-6">
          <h2 className="text-3xl font-extrabold tracking-tight text-[var(--color-on-surface)] leading-tight">
            Your Entire Journey, Managed.
          </h2>
          <p className="text-sm md:text-base text-muted leading-relaxed">
            One unified platform for everything. From planning the fastest route to contactless payments, TransitFlow integrates every aspect of your daily commute into a single, seamless experience.
          </p>

          <div className="space-y-4 pt-2">
            {/* Row 1 */}
            <div className="flex gap-4">
              <div className="h-10 w-10 rounded-xl bg-[var(--color-primary)] bg-opacity-10 flex items-center justify-center shrink-0 border border-[var(--color-primary)] border-opacity-15 text-[var(--color-primary)]">
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[var(--color-on-surface)]">Tap & Go Payments</h4>
                <p className="text-xs text-muted mt-1 leading-relaxed">
                  Use your digital smart card or contactless bank card to board instantly.
                </p>
              </div>
            </div>

            {/* Row 2 */}
            <div className="flex gap-4">
              <div className="h-10 w-10 rounded-xl bg-[var(--color-primary)] bg-opacity-10 flex items-center justify-center shrink-0 border border-[var(--color-primary)] border-opacity-15 text-[var(--color-primary)]">
                <Bell className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[var(--color-on-surface)]">Live Status Updates</h4>
                <p className="text-xs text-muted mt-1 leading-relaxed">
                  Get push notifications for delays or platform changes before you arrive.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Footer */}
      <footer className="mt-auto border-t border-[var(--color-outline-variant)] bg-[var(--color-surface)] py-12">
        <div className="max-w-6xl mx-auto px-6 w-full flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="space-y-2 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2.5">
              <div className="h-7 w-7 rounded-lg bg-[var(--color-primary)] flex items-center justify-center text-white">
                <Bus className="h-4 w-4" />
              </div>
              <span className="font-extrabold text-base tracking-tight">TransitFlow</span>
            </div>
            <p className="text-xs text-muted">
              © 2026 TransitFlow. All rights reserved. Built for smarter cities.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-6 text-xs text-muted">
            <Link href="#privacy" className="hover:text-[var(--color-on-surface)] transition-colors">Privacy Policy</Link>
            <Link href="#terms" className="hover:text-[var(--color-on-surface)] transition-colors">Terms of Service</Link>
            <Link href="#support" className="hover:text-[var(--color-on-surface)] transition-colors">Customer Support</Link>
            <Link href="#careers" className="hover:text-[var(--color-on-surface)] transition-colors">Careers</Link>
            <Link href="#api" className="hover:text-[var(--color-on-surface)] transition-colors">API Docs</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
