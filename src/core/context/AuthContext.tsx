'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import Cookies from 'js-cookie';
import { apiClient } from '../lib/api-client';
import { useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';

interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  walletBalance?: number;
  isOnShift?: boolean;
  currentBusRegistration?: string;
  nfcUid?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  role: 'passenger' | 'driver' | 'company' | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<'passenger' | 'company' | 'driver'>;
  googleLogin: (idToken: string, role: 'passenger' | 'company') => Promise<'passenger' | 'company'>;
  unifiedGoogleLogin: (idToken: string) => Promise<'passenger' | 'company' | 'driver'>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<'passenger' | 'driver' | 'company' | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const socketRef = useRef<Socket | null>(null);

  // ── Connect to notifications WebSocket ──────────────────────────────────
  const connectNotificationsSocket = (token: string) => {
    // Tear down any existing socket first
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    const socket = io(`${API_BASE}/notifications`, {
      transports: ['websocket'],
      auth: { token },
    });

    socket.on('connect', () => {
      console.log('[WS] Connected to /notifications');
    });

    socket.on('connect_error', (err) => {
      console.error('[WS] Connection error for /notifications namespace:', err.message);
    });

    socket.on('error', (err) => {
      console.error('[WS] General socket error:', err);
    });

    // Real-time wallet balance update from backend
    socket.on('wallet_updated', (data: { balance: number | string | { $numberDecimal: string } }) => {
      let newBalance: number;
      if (typeof data.balance === 'number') {
        newBalance = data.balance;
      } else if (typeof data.balance === 'string') {
        newBalance = parseFloat(data.balance);
      } else if (data.balance && typeof data.balance === 'object' && '$numberDecimal' in data.balance) {
        newBalance = parseFloat(data.balance.$numberDecimal);
      } else {
        console.warn('[WS] Received wallet_updated with unparseable balance:', data);
        return;
      }
      console.log('[WS] wallet_updated → new balance:', newBalance);
      setUser((prev) => prev ? { ...prev, walletBalance: newBalance } : prev);
    });

    socket.on('disconnect', () => {
      console.log('[WS] Disconnected from /notifications');
    });

    socketRef.current = socket;
  };

  const disconnectNotificationsSocket = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  };
  // ────────────────────────────────────────────────────────────────────────

  const loadUserFromToken = async () => {
    const token = Cookies.get('transit_token');
    if (!token) {
      setUser(null);
      setRole(null);
      setLoading(false);
      return;
    }

    try {
      const response = await apiClient.get('/auth/me');
      if (response.status === 200) {
        setUser(response.data.user);
        setRole(response.data.role);
        // Connect WebSocket for real-time updates
        connectNotificationsSocket(token);
      } else {
        throw new Error('Failed to fetch user info');
      }
    } catch (error) {
      // Clear token since it's invalid or expired and refresh failed
      Cookies.remove('transit_token');
      Cookies.remove('transit_refresh_token');
      setUser(null);
      setRole(null);
      disconnectNotificationsSocket();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserFromToken();
    // Cleanup socket on unmount
    return () => disconnectNotificationsSocket();
  }, []);

  const login = async (email: string, password: string): Promise<'passenger' | 'company' | 'driver'> => {
    setLoading(true);
    try {
      const response = await apiClient.post('/auth/login', { email, password });
      if (response.status === 200 || response.status === 201) {
        const { accessToken, refreshToken, role: userRole } = response.data;
        Cookies.set('transit_token', accessToken, { expires: 7 });
        Cookies.set('transit_refresh_token', refreshToken, { expires: 7 });
        setRole(userRole);
        
        // Sync profile details
        const profileRes = await apiClient.get('/auth/me');
        if (profileRes.status === 200) {
          setUser(profileRes.data.user);
        }

        // Connect WebSocket after login
        connectNotificationsSocket(accessToken);
        
        return userRole;
      }
      throw new Error('Verification failed');
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = async (idToken: string, targetRole: 'passenger' | 'company'): Promise<'passenger' | 'company'> => {
    setLoading(true);
    try {
      const response = await apiClient.post(`/auth/${targetRole}/google`, { idToken });
      if (response.status === 200 || response.status === 201) {
        const { accessToken, refreshToken, role: userRole } = response.data;
        Cookies.set('transit_token', accessToken, { expires: 7 });
        Cookies.set('transit_refresh_token', refreshToken, { expires: 7 });
        setRole(userRole);
        
        const profileRes = await apiClient.get('/auth/me');
        if (profileRes.status === 200) {
          setUser(profileRes.data.user);
        }

        connectNotificationsSocket(accessToken);
        
        return userRole as 'passenger' | 'company';
      }
      throw new Error('Google verification failed');
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const unifiedGoogleLogin = async (idToken: string): Promise<'passenger' | 'company' | 'driver'> => {
    setLoading(true);
    try {
      const response = await apiClient.post(`/auth/unified/google`, { idToken });
      if (response.status === 200 || response.status === 201) {
        const { accessToken, refreshToken, role: userRole } = response.data;
        Cookies.set('transit_token', accessToken, { expires: 7 });
        Cookies.set('transit_refresh_token', refreshToken, { expires: 7 });
        setRole(userRole);
        
        const profileRes = await apiClient.get('/auth/me');
        if (profileRes.status === 200) {
          setUser(profileRes.data.user);
        }

        connectNotificationsSocket(accessToken);
        
        return userRole as 'passenger' | 'company' | 'driver';
      }
      throw new Error('Unified Google verification failed');
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      // Attempt backend logout if possible
      await apiClient.post('/auth/logout');
    } catch {
      // Ignore network errors on logout to ensure user always gets logged out locally
    } finally {
      disconnectNotificationsSocket();
      Cookies.remove('transit_token');
      Cookies.remove('transit_refresh_token');
      setUser(null);
      setRole(null);
      setLoading(false);
      router.push('/');
    }
  };

  const refreshProfile = async (): Promise<boolean> => {
    try {
      const response = await apiClient.get('/auth/me');
      if (response.status === 200) {
        setUser(response.data.user);
        return true;
      }
      return false;
    } catch (error: any) {
      // Return false silently for 401s since they represent expected unauthenticated redirects
      if (error.response?.status !== 401) {
        console.warn('Failed to refresh profile:', error.message || error);
      }
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, login, googleLogin, unifiedGoogleLogin, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
