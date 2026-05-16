import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import apiClient from '../api/client';
import toast from 'react-hot-toast';

interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  learning_goal: string | null;
  current_level: string | null;
  hours_per_week: number | null;
  deadline: string | null;
  role: string;
  current_streak: number;
  longest_streak: number;
  exp_points: number;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (fullName: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On app mount, check if a token exists and fetch user profile (with daily ping)
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      apiClient.post('/api/users/me/ping')
        .then((res) => setUser(res.data))
        .catch(() => {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const res = await apiClient.post('/api/auth/login', { email, password });
    const { access_token, refresh_token, user: userData } = res.data;
    localStorage.setItem('access_token', access_token);
    localStorage.setItem('refresh_token', refresh_token);
    
    // Ping for daily streak after login
    try {
      const pingRes = await apiClient.post('/api/users/me/ping');
      setUser(pingRes.data);
    } catch {
      setUser(userData);
    }
    
    toast.success(`Welcome back, ${userData.full_name.split(' ')[0]}! 👋`);
  };

  const register = async (full_name: string, email: string, password: string) => {
    const res = await apiClient.post('/api/auth/register', { email, password, full_name });
    const { access_token, refresh_token, user: userData } = res.data;
    localStorage.setItem('access_token', access_token);
    localStorage.setItem('refresh_token', refresh_token);
    setUser(userData);
    toast.success('Account created! Welcome aboard 🎉');
  };

  const logout = async () => {
    try {
      await apiClient.post('/api/auth/logout');
    } catch {
      // Ignore errors on logout
    }
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
    toast.success('Signed out successfully');
  };

  const updateUser = (data: Partial<User>) => {
    setUser((prev) => prev ? { ...prev, ...data } : null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
