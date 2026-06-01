'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { apiClient } from '../lib/api-client';
import { useRouter } from 'next/navigation';

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
  loginPassenger: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<'passenger' | 'driver' | 'company' | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

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
      } else {
        throw new Error('Failed to fetch user info');
      }
    } catch (error) {
      // Clear token since it's invalid or expired and refresh failed
      Cookies.remove('transit_token');
      Cookies.remove('transit_refresh_token');
      setUser(null);
      setRole(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserFromToken();
  }, []);

  const loginPassenger = async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await apiClient.post('/auth/passenger/login', { email, password });
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
        
        router.push('/passenger/dashboard');
      }
    } catch (error) {
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
    <AuthContext.Provider value={{ user, role, loading, loginPassenger, logout, refreshProfile }}>
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
