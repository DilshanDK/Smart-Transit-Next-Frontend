'use client';

import React, { useState } from 'react';
import { 
  Bus, 
  Clock, 
  Shield, 
  CreditCard, 
  Bell, 
  ArrowRight, 
  ChevronRight, 
  Menu, 
  X,
  Compass,
  QrCode,
  MapPin,
  CheckCircle2,
  Activity,
  DollarSign,
  UserCheck
} from 'lucide-react';
import Link from 'next/link';
import ThemeToggle from './components/theme-toggle';

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(1);

  // Form states for mock steps
  const [mockName, setMockName] = useState('John Doe');
  const [mockEmail, setMockEmail] = useState('john@example.com');
  const [topUpAmount, setTopUpAmount] = useState('1000');

  return (
    <div className="app-shell min-h-screen flex flex-col bg-[var(--color-bg)]">
      
      {/* 1. Header (Navbar) */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[var(--color-surface)] bg-opacity-80 border-b border-[var(--color-outline-variant)]">
        <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-teal-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Bus className="h-5 w-5 text-white" />
            </div>
            <span className="font-extrabold text-xl tracking-tight text-[var(--color-on-surface)] bg-gradient-to-r from-indigo-400 to-teal-400 bg-clip-text text-transparent">
              TransitFlow
            </span>
          </Link>

          {/* Navigation Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-8">
            <Link href="#steps" className="text-sm font-semibold text-muted hover:text-[var(--color-on-surface)] transition-colors">
              How It Works
            </Link>
            <Link href="#services" className="text-sm font-semibold text-muted hover:text-[var(--color-on-surface)] transition-colors">
              Services
            </Link>
            <Link href="#features" className="text-sm font-semibold text-muted hover:text-[var(--color-on-surface)] transition-colors">
              Features
            </Link>
          </nav>

          {/* Right Action buttons */}
          <div className="hidden md:flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-xs text-muted mr-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Server Port: 5000</span>
            </div>
            <ThemeToggle />
            <Link href="/login" className="text-sm font-bold text-[var(--color-on-surface)] hover:text-indigo-400 transition-colors mr-2">
              Log In
            </Link>
            <Link href="/passenger/register" className="bg-gradient-to-r from-indigo-500 to-teal-500 hover:from-indigo-600 hover:to-teal-600 text-white font-bold text-sm px-6 py-2.5 rounded-full shadow-lg shadow-indigo-500/15 transition-all text-center">
              Sign Up
            </Link>
          </div>

          {/* Mobile Menu Controls */}
          <div className="md:hidden flex items-center gap-3">
            <ThemeToggle />
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-muted hover:text-[var(--color-on-surface)] transition-colors focus:outline-none"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[var(--color-outline-variant)] bg-[var(--color-surface)] px-6 py-4 flex flex-col gap-4 animate-fade-in">
            <Link href="#steps" onClick={() => setMobileMenuOpen(false)} className="text-sm font-bold text-muted py-2">
              How It Works
            </Link>
            <Link href="#services" onClick={() => setMobileMenuOpen(false)} className="text-sm font-bold text-muted py-2">
              Services
            </Link>
            <Link href="#features" onClick={() => setMobileMenuOpen(false)} className="text-sm font-bold text-muted py-2">
              Features
            </Link>
            <div className="h-px bg-[var(--color-outline-variant)] my-1" />
            <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="text-sm font-bold text-center py-2 text-[var(--color-on-surface)]">
              Log In
            </Link>
            <Link href="/passenger/register" onClick={() => setMobileMenuOpen(false)} className="bg-gradient-to-r from-indigo-500 to-teal-500 text-white text-center font-bold py-3 rounded-xl mt-1 block shadow-lg shadow-indigo-500/10">
              Sign Up
            </Link>
          </div>
        )}
      </header>

      {/* 2. Hero Section (Dynamic Refactored Layout) */}
      <section className="relative overflow-hidden border-b border-[var(--color-outline-variant)] bg-linear-to-b from-[var(--color-surface)] to-[var(--color-bg)] pt-16 pb-12 md:pt-24 md:pb-20 lg:pt-32 lg:pb-28">
        
        {/* Glow ambient backdrops */}
        <div className="absolute top-[10%] left-[-10%] w-[35%] h-[35%] rounded-full bg-indigo-500/10 blur-[130px] pointer-events-none" />
        <div className="absolute bottom-[5%] right-[-10%] w-[35%] h-[35%] rounded-full bg-teal-500/10 blur-[130px] pointer-events-none" />
        
        <div className="max-w-[1400px] mx-auto px-6 grid gap-8 lg:gap-16 lg:grid-cols-12 items-center relative z-10">
          
          {/* Hero Left Content */}
          <div className="lg:col-span-6 space-y-6 md:space-y-8 text-left pr-4">
            <div className="inline-flex items-center gap-2.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20">
              <span className="h-2 w-2 rounded-full bg-indigo-400 animate-pulse" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400">Unified Transit Infrastructure</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-[var(--color-on-surface)] leading-[1.05]">
              Smarter <span className="bg-gradient-to-r from-indigo-400 to-teal-400 bg-clip-text text-transparent">Journeys</span> For Connected Cities.
            </h1>
            
            <p className="text-sm md:text-base lg:text-lg text-muted max-w-xl leading-relaxed">
              Experience seamless, real-time travel across our unified network of buses and trains. Plan schedules, top up wallets, and tap card terminals instantly.
            </p>
            
            <div className="flex flex-wrap items-center gap-4">
              <Link href="/passenger/register" className="bg-gradient-to-r from-indigo-500 to-teal-500 hover:from-indigo-600 hover:to-teal-600 text-white font-bold text-sm px-8 py-3.5 rounded-full shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2 group">
                <span>Get Started</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a href="#steps" className="btn-outline px-8 py-3.5 rounded-full text-sm font-bold flex items-center justify-center gap-1.5">
                Learn More
              </a>
            </div>
          </div>

          {/* Hero Right: Mosaic Card Grid Layout (Matching PrimeCruise structure) */}
          <div className="lg:col-span-6 relative mt-12 lg:mt-0">
            <div className="grid grid-cols-12 gap-4">
              
              {/* Card 1: Vertical Card (Left Column - Spans 5 columns) */}
              <div className="col-span-5 card p-5 flex flex-col justify-between min-h-[310px] relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-[var(--color-primary)]/5 blur-xl group-hover:bg-[var(--color-primary)]/10 transition-colors" />
                <div className="space-y-4">
                  <div className="h-10 w-10 rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center border border-[var(--color-primary)]/20 text-[var(--color-primary)]">
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-muted uppercase tracking-wider">Transit Pass</h4>
                    <h3 className="text-sm font-extrabold text-[var(--color-on-surface)] mt-1">TransitFlow Plus</h3>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="text-[10px] font-mono tracking-widest text-muted">
                    •••• •••• 4289
                  </div>
                  <div className="flex items-center justify-between border-t border-[var(--color-outline-variant)] pt-3">
                    <span className="text-[9px] font-bold text-emerald-500 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/25">Contactless</span>
                    <span className="text-[10px] font-bold text-[var(--color-on-surface)]">LKR 1,250</span>
                  </div>
                </div>
              </div>

              {/* Right Column contains Card 2 and Card 3 */}
              <div className="col-span-7 flex flex-col gap-4">
                
                {/* Card 2: Top Right - Live GPS Tracking Map */}
                <div className="card p-4 h-[185px] overflow-hidden relative flex flex-col justify-between">
                  <div className="flex items-center justify-between z-10">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping" />
                      <span className="text-[11px] font-bold text-[var(--color-on-surface)]">Route 120 - Active</span>
                    </div>
                    <span className="text-[10px] text-muted font-semibold">Live GPS</span>
                  </div>

                  {/* Mock Mini Map Graphics */}
                  <div className="absolute inset-x-0 bottom-0 h-[100px] bg-[var(--color-surface-variant)] overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(128,128,128,0.1)_1px,transparent_1px)] bg-[size:12px_12px]" />
                    {/* Dotted path route */}
                    <div className="absolute top-[40%] left-[10%] w-[80%] h-0.5 border-t-2 border-dashed border-[var(--color-primary)]/50" />
                    {/* Pulsing Bus Icon */}
                    <div className="absolute top-[32%] left-[45%] h-6 w-6 rounded-lg bg-[var(--color-primary)] flex items-center justify-center shadow-lg shadow-[var(--color-primary)]/50 animate-bounce">
                      <Bus className="h-3 w-3 text-white" />
                    </div>
                    {/* Stops */}
                    <div className="absolute top-[35%] left-[10%] h-2.5 w-2.5 rounded-full bg-teal-400 border-2 border-[var(--color-surface)]" />
                    <div className="absolute top-[35%] left-[80%] h-2.5 w-2.5 rounded-full bg-teal-400 border-2 border-[var(--color-surface)]" />
                  </div>

                  <div className="z-10 bg-[var(--color-surface)]/80 backdrop-blur-sm px-2.5 py-1.5 rounded-lg border border-[var(--color-outline-variant)] flex items-center justify-between text-[10px]">
                    <span className="text-muted">Next Stop: Town Hall</span>
                    <span className="font-bold text-[var(--color-primary)]">ETA: 4 min</span>
                  </div>
                </div>

                {/* Card 3: Bottom Right - Dynamic Scanning QR Pass */}
                <div className="card p-4 h-[110px] flex items-center justify-between gap-4 overflow-hidden relative">
                  <div className="space-y-2">
                    <div className="h-7 w-7 rounded-lg bg-[var(--color-primary)]/10 flex items-center justify-center text-[var(--color-primary)]">
                      <QrCode className="h-4 w-4" />
                    </div>
                    <div className="space-y-0.5">
                      <h4 className="text-[10px] font-extrabold text-[var(--color-on-surface)]">Dynamic Boarding QR</h4>
                      <span className="text-[9px] text-muted">Refreshes in 18s</span>
                    </div>
                  </div>
                  
                  {/* Mock QR graphic (Complex High-Density Dynamic Grid) */}
                  <div className="h-16 w-16 bg-white p-1.5 rounded-md shrink-0 relative overflow-hidden shadow-md border border-neutral-200">
                    <style>{`
                      @keyframes qr-refresh {
                        0%, 85% { opacity: 1; filter: blur(0px); transform: scale(1); }
                        90% { opacity: 0.2; filter: blur(3px); transform: scale(0.95); }
                        95% { opacity: 1; filter: blur(0px); transform: scale(1.05); }
                        100% { opacity: 1; filter: blur(0px); transform: scale(1); }
                      }
                      @keyframes scan {
                        0% { top: -10%; opacity: 0; }
                        15% { opacity: 1; }
                        85% { opacity: 1; }
                        100% { top: 110%; opacity: 0; }
                      }
                    `}</style>
                    <div className="w-full h-full relative" style={{ animation: 'qr-refresh 5s infinite' }}>
                      {/* High-density 9x9 grid */}
                      <div className="grid grid-cols-9 grid-rows-9 gap-[1px] w-full h-full">
                        {[...Array(81)].map((_, i) => {
                          const row = Math.floor(i / 9);
                          const col = i % 9;
                          // Leave space for the 3 anchor squares (4x4 blocks in corners)
                          const isTL = row < 4 && col < 4;
                          const isTR = row < 4 && col > 4;
                          const isBL = row > 4 && col < 4;
                          if (isTL || isTR || isBL) return <div key={i} />;
                          
                          // Pseudo-random dense pattern
                          const isFilled = (row * 13 + col * 7) % 3 !== 0;
                          if (!isFilled) return <div key={i} />;
                          
                          return (
                            <div 
                              key={i} 
                              className="bg-slate-800 rounded-[1px] animate-pulse" 
                              style={{ animationDuration: `${1 + ((i % 5) * 0.5)}s` }} 
                            />
                          );
                        })}
                      </div>
                      
                      {/* 3 Corner Anchor Squares */}
                      <div className="absolute top-0 left-0 w-[20px] h-[20px] border-[2.5px] border-slate-800 rounded-[3px] flex items-center justify-center">
                        <div className="w-2.5 h-2.5 bg-slate-800 rounded-[1px]" />
                      </div>
                      <div className="absolute top-0 right-0 w-[20px] h-[20px] border-[2.5px] border-slate-800 rounded-[3px] flex items-center justify-center">
                        <div className="w-2.5 h-2.5 bg-slate-800 rounded-[1px]" />
                      </div>
                      <div className="absolute bottom-0 left-0 w-[20px] h-[20px] border-[2.5px] border-slate-800 rounded-[3px] flex items-center justify-center">
                        <div className="w-2.5 h-2.5 bg-slate-800 rounded-[1px]" />
                      </div>
                    </div>
                    
                    {/* Scanner line animation */}
                    <div 
                      className="absolute left-0 right-0 h-[2px] bg-emerald-500 shadow-[0_0_12px_4px_rgba(16,185,129,0.6)] z-20 pointer-events-none" 
                      style={{ animation: 'scan 2.5s linear infinite' }} 
                    />
                  </div>
                </div>

              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 3. Interactive 3-Step Registration Section (Matching Reference layout) */}
      <section id="steps" className="py-16 md:py-24 max-w-[1400px] mx-auto px-6 w-full space-y-12">
        <div className="text-center space-y-3">
          <span className="text-xs font-black uppercase tracking-wider text-[var(--color-primary)]">Simple Integration</span>
          <h2 className="text-3xl md:text-4xl font-black tracking-tight text-[var(--color-on-surface)]">
            Easy Onboarding in 3 Steps!
          </h2>
          <p className="text-sm text-muted max-w-lg mx-auto">
            Plan, load, and travel. Our automated system handles transactions seamlessly on our secured platform.
          </p>
        </div>

        {/* Tab switch buttons */}
        <div className="max-w-3xl mx-auto grid grid-cols-3 gap-2 p-1.5 bg-[var(--color-surface-variant)] border border-[var(--color-outline-variant)] rounded-2xl">
          <button 
            onClick={() => setActiveStep(1)}
            className={`py-3.5 rounded-xl font-bold text-xs md:text-sm cursor-pointer transition-all ${activeStep === 1 ? 'bg-[var(--color-surface)] text-[var(--color-on-surface)] shadow-md border border-[var(--color-outline-variant)]' : 'text-muted hover:text-[var(--color-on-surface)]'}`}
          >
            Step 1
          </button>
          <button 
            onClick={() => setActiveStep(2)}
            className={`py-3.5 rounded-xl font-bold text-xs md:text-sm cursor-pointer transition-all ${activeStep === 2 ? 'bg-[var(--color-surface)] text-[var(--color-on-surface)] shadow-md border border-[var(--color-outline-variant)]' : 'text-muted hover:text-[var(--color-on-surface)]'}`}
          >
            Step 2
          </button>
          <button 
            onClick={() => setActiveStep(3)}
            className={`py-3.5 rounded-xl font-bold text-xs md:text-sm cursor-pointer transition-all ${activeStep === 3 ? 'bg-[var(--color-surface)] text-[var(--color-on-surface)] shadow-md border border-[var(--color-outline-variant)]' : 'text-muted hover:text-[var(--color-on-surface)]'}`}
          >
            Step 3
          </button>
        </div>

        {/* Tab content renderer */}
        <div className="card p-8 md:p-12 backdrop-blur-md bg-opacity-70">
          {activeStep === 1 && (
            <div className="grid md:grid-cols-12 gap-10 items-center animate-[fade-in_0.4s_ease-out]">
              {/* Step 1 Left */}
              <div className="md:col-span-7 space-y-6 text-left">
                <div className="inline-flex items-center gap-2 text-xs font-bold text-indigo-400 uppercase tracking-wide">
                  <UserCheck className="h-4.5 w-4.5 text-indigo-400" />
                  <span>Account Setup</span>
                </div>
                <h3 className="text-2xl md:text-3xl font-black text-[var(--color-on-surface)] tracking-tight">
                  Activate Your Commuter Profile
                </h3>
                <p className="text-sm md:text-base text-muted leading-relaxed">
                  Provide your email and details to register. Your passenger profile acts as the digital key for your wallet and dynamic token credentials.
                </p>
                <div className="h-px bg-[var(--color-outline-variant)]" />
                <ul className="space-y-3 text-sm text-muted">
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-indigo-400" />
                    <span>Access passenger and company dashboard panels</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-indigo-400" />
                    <span>Dynamic token generation mapping on auth creation</span>
                  </li>
                </ul>
              </div>

              {/* Step 1 Right (Mock Input Form) */}
              <div className="md:col-span-5">
                <div className="p-6 bg-[var(--color-surface)] shadow-md rounded-2xl border border-[var(--color-outline-variant)] space-y-4">
                  <div className="flex items-center justify-between border-b border-[var(--color-outline-variant)] pb-3">
                    <span className="text-xs font-bold text-[var(--color-on-surface)]">1st Step: Create Passenger</span>
                    <span className="text-[10px] text-indigo-400 font-bold bg-indigo-500/10 px-2 py-0.5 rounded">Fast Setup</span>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted">Full Name</label>
                    <input 
                      type="text" 
                      value={mockName} 
                      onChange={(e) => setMockName(e.target.value)}
                      className="w-full px-3.5 py-2 bg-[var(--color-bg)] border border-[var(--color-outline-variant)] rounded-xl text-xs text-[var(--color-on-surface)] focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted">Email Address</label>
                    <input 
                      type="email" 
                      value={mockEmail}
                      onChange={(e) => setMockEmail(e.target.value)}
                      className="w-full px-3.5 py-2 bg-[var(--color-bg)] border border-[var(--color-outline-variant)] rounded-xl text-xs text-[var(--color-on-surface)] focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <button onClick={() => setActiveStep(2)} className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-teal-500 hover:opacity-90 text-white text-xs font-bold transition-all mt-2">
                    Proceed to Step 2
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeStep === 2 && (
            <div className="grid md:grid-cols-12 gap-10 items-center animate-[fade-in_0.4s_ease-out]">
              {/* Step 2 Left */}
              <div className="md:col-span-7 space-y-6 text-left">
                <div className="inline-flex items-center gap-2 text-xs font-bold text-teal-400 uppercase tracking-wide">
                  <DollarSign className="h-4.5 w-4.5 text-teal-400" />
                  <span>Wallet Top-Up</span>
                </div>
                <h3 className="text-2xl md:text-3xl font-black text-[var(--color-on-surface)] tracking-tight">
                  Fund Your Digital Pass Account
                </h3>
                <p className="text-sm md:text-base text-muted leading-relaxed">
                  Add credits securely using Stripe Checkout or practice wallet adjustments immediately using our developmental Sandbox Credit override.
                </p>
                <div className="h-px bg-[var(--color-outline-variant)]" />
                <ul className="space-y-3 text-sm text-muted">
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-teal-400" />
                    <span>Secure Stripe webhook verification ledger mapping</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-teal-400" />
                    <span>Instantly adjust wallet balance in sandbox mode</span>
                  </li>
                </ul>
              </div>

              {/* Step 2 Right (Mock Payment widget) */}
              <div className="md:col-span-5">
                <div className="p-6 bg-[var(--color-surface)] shadow-md rounded-2xl border border-[var(--color-outline-variant)] space-y-4">
                  <div className="flex items-center justify-between border-b border-[var(--color-outline-variant)] pb-3">
                    <span className="text-xs font-bold text-[var(--color-on-surface)]">2nd Step: Fund Wallet</span>
                    <span className="text-[10px] text-teal-400 font-bold bg-teal-500/10 px-2 py-0.5 rounded">Credit Card</span>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted">Top Up Amount (LKR)</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted text-xs font-bold">LKR</span>
                      <input 
                        type="number" 
                        value={topUpAmount}
                        onChange={(e) => setTopUpAmount(e.target.value)}
                        className="w-full pl-11 pr-3 py-2 bg-[var(--color-bg)] border border-[var(--color-outline-variant)] rounded-xl text-xs text-[var(--color-on-surface)] focus:outline-none focus:border-teal-500"
                      />
                    </div>
                  </div>
                  <div className="p-3 bg-[var(--color-surface-variant)] rounded-xl text-[10px] text-muted flex items-center justify-between">
                    <span>Account: {mockEmail}</span>
                    <span className="font-bold text-[var(--color-on-surface)]">LKR {topUpAmount || '0'}</span>
                  </div>
                  <button onClick={() => setActiveStep(3)} className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-teal-500 hover:opacity-90 text-white text-xs font-bold transition-all mt-2">
                    Proceed to Step 3
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeStep === 3 && (
            <div className="grid md:grid-cols-12 gap-10 items-center animate-[fade-in_0.4s_ease-out]">
              {/* Step 3 Left */}
              <div className="md:col-span-7 space-y-6 text-left">
                <div className="inline-flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wide">
                  <Activity className="h-4.5 w-4.5 text-emerald-400" />
                  <span>Tap & Travel</span>
                </div>
                <h3 className="text-2xl md:text-3xl font-black text-[var(--color-on-surface)] tracking-tight">
                  Seamless Ticket Boarding
                </h3>
                <p className="text-sm md:text-base text-muted leading-relaxed">
                  Tap your QR code token or NFC card at the bus entry device. The system checks your balance, boards you, and deducts fare automatically on tap-off.
                </p>
                <div className="h-px bg-[var(--color-outline-variant)]" />
                <ul className="space-y-3 text-sm text-muted">
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    <span>Real-time Socket.io driver telemetry tracking</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    <span>Automatic fare calculations based on Haversine distance</span>
                  </li>
                </ul>
              </div>

              {/* Step 3 Right (Mock Scan Result Widget) */}
              <div className="md:col-span-5">
                <div className="p-6 bg-[var(--color-surface)] shadow-md rounded-2xl border border-[var(--color-outline-variant)] space-y-4">
                  <div className="flex items-center justify-between border-b border-[var(--color-outline-variant)] pb-3">
                    <span className="text-xs font-bold text-[var(--color-on-surface)]">3rd Step: Tap Terminal</span>
                    <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">Validated</span>
                  </div>
                  <div className="py-6 flex flex-col items-center justify-center text-center gap-3 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
                    <div className="h-12 w-12 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30 animate-pulse">
                      <CheckCircle2 className="h-6 w-6" />
                    </div>
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-bold text-[var(--color-on-surface)]">ACCESS GRANTED</h4>
                      <p className="text-[10px] text-muted">Boarded Bus: WP-GA-9021</p>
                    </div>
                  </div>
                  <button onClick={() => setActiveStep(1)} className="w-full py-2.5 rounded-xl border border-[var(--color-outline-variant)] hover:bg-[var(--color-surface-variant)] text-[var(--color-on-surface)] text-xs font-bold transition-all">
                    Restart Onboarding Demo
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 4. Service Coverage Section */}
      <section id="services" className="py-16 md:py-24 border-t border-[var(--color-outline-variant)] bg-[var(--color-surface)] bg-opacity-30">
        <div className="max-w-6xl mx-auto px-6 w-full space-y-12">
          <div className="text-center space-y-3">
            <span className="text-xs font-black uppercase tracking-wider text-teal-400">Versatile Transport</span>
            <h2 className="text-3xl font-extrabold tracking-tight text-[var(--color-on-surface)]">Our Integrated Services</h2>
            <p className="text-sm text-muted">A look at the options supported in the transit schemas.</p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {/* Bus Service */}
            <div className="card p-6 md:p-8 space-y-4">
              <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/15 flex items-center justify-center text-indigo-400 shadow-md">
                <Bus className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-lg text-[var(--color-on-surface)]">Bus Services</h3>
              <p className="text-sm text-muted leading-relaxed">
                Connect and manage driver shifts, track bus registrations dynamically, and log passenger boardings with standard or custom fare rates.
              </p>
            </div>

            {/* Metro Services */}
            <div className="card p-6 md:p-8 space-y-4">
              <div className="h-10 w-10 rounded-xl bg-teal-500/10 border border-teal-500/15 flex items-center justify-center text-teal-400 shadow-md">
                <Compass className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-lg text-[var(--color-on-surface)]">Route Operations</h3>
              <p className="text-sm text-muted leading-relaxed">
                Render and query route GeoJSON lines, verify live buses on map, and support multiple checkpoints/station zones.
              </p>
            </div>

            {/* Smart Ledger card */}
            <div className="card p-6 md:p-8 space-y-4">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/15 flex items-center justify-center text-emerald-400 shadow-md">
                <CreditCard className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-lg text-[var(--color-on-surface)]">Smart Card Systems</h3>
              <p className="text-sm text-muted leading-relaxed">
                Configure passenger accounts with physical NFC card bindings, and trigger contactless billing instantly using database session isolation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Production Ready Features List */}
      <section id="features" className="py-16 md:py-24 max-w-[1400px] mx-auto px-6 w-full grid gap-12 md:grid-cols-12 items-center">
        {/* Left Column Graphic */}
        <div className="md:col-span-5 flex justify-center">
          <div className="w-80 p-6 card bg-slate-950/30 shadow-2xl relative overflow-hidden flex flex-col gap-6">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div className="flex items-center gap-2">
                <Activity className="h-4.5 w-4.5 text-indigo-400" />
                <span className="text-xs font-bold text-white">System Security</span>
              </div>
              <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">Active</span>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Helmet Headers</span>
                <span className="font-mono text-white text-[10px] bg-slate-900 px-2 py-0.5 rounded">HSTS & CSP</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">CORS Origins</span>
                <span className="font-mono text-white text-[10px] bg-slate-900 px-2 py-0.5 rounded">Restricted</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Throttler Rate Limits</span>
                <span className="font-mono text-white text-[10px] bg-slate-900 px-2 py-0.5 rounded">10 req/sec</span>
              </div>
            </div>

            <div className="p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-xl text-[10px] text-indigo-300 leading-relaxed">
              <strong>Tip:</strong> Rate limits are configured globally to protect authenticate (/auth/*) calls from brute-force attempts.
            </div>
          </div>
        </div>

        {/* Right Info */}
        <div className="md:col-span-7 space-y-6 text-left">
          <span className="text-xs font-black uppercase tracking-wider text-indigo-400">Production Hardened</span>
          <h2 className="text-3xl font-extrabold tracking-tight text-[var(--color-on-surface)] leading-tight">
            Secured Platform & Real-Time Aggregations.
          </h2>
          <p className="text-sm md:text-base text-muted leading-relaxed">
            The backend engine runs on a secured core featuring Helmet.js, CORS filters, and global throttlers, while handling real-time vehicle GPS coordination and nightly payout cron cycles.
          </p>

          <div className="space-y-4 pt-2">
            <div className="flex gap-4">
              <div className="h-10 w-10 rounded-xl bg-indigo-500/10 flex items-center justify-center shrink-0 border border-indigo-500/15 text-indigo-400 shadow-md">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[var(--color-on-surface)]">Helmet.js Protection</h4>
                <p className="text-xs text-muted mt-1 leading-relaxed">
                  Safeguards responses against common vulnerabilities, cross-site scripting, and framing hijacks.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="h-10 w-10 rounded-xl bg-teal-500/10 flex items-center justify-center shrink-0 border border-teal-500/15 text-teal-400 shadow-md">
                <Bell className="h-5.5 w-5.5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[var(--color-on-surface)]">Firebase Cloud Messaging</h4>
                <p className="text-xs text-muted mt-1 leading-relaxed">
                  Send live push alerts (such as boarding confirmations and approaching buses) straight to commuter devices.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--color-outline-variant)] bg-[var(--color-surface)] py-12 mt-12">
        <div className="max-w-[1400px] mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="space-y-2 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2.5">
              <div className="h-7 w-7 rounded-lg bg-gradient-to-tr from-indigo-500 to-teal-400 flex items-center justify-center text-white shadow">
                <Bus className="h-4 w-4" />
              </div>
              <span className="font-extrabold text-base tracking-tight">TransitFlow</span>
            </div>
            <p className="text-xs text-muted">
              © 2026 TransitFlow. All rights reserved. Built for smarter cities.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-6 text-xs text-muted">
            <Link href="#steps" className="hover:text-[var(--color-on-surface)] transition-colors">How It Works</Link>
            <Link href="#services" className="hover:text-[var(--color-on-surface)] transition-colors">Services</Link>
            <Link href="#features" className="hover:text-[var(--color-on-surface)] transition-colors">Security</Link>
            <Link href="/login" className="hover:text-[var(--color-on-surface)] transition-colors">Passenger Panel</Link>
            <Link href="/login" className="hover:text-[var(--color-on-surface)] transition-colors">Operator Panel</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
