import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'ADMIN' | 'STAFF';
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password?: string) => Promise<void>;
  logout: () => void;
  switchUser: (role: 'admin' | 'staff' | 'manager') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('dataroom_token'));
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('dataroom_token');
      if (storedToken) {
        try {
          const res = await api.get('/auth/me');
          if (res.data.success) {
            setUser(res.data.user);
          }
        } catch (e) {
          localStorage.removeItem('dataroom_token');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email: string, password: string = 'Admin@123') => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data.success) {
      localStorage.setItem('dataroom_token', res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
    }
  };

  const logout = () => {
    localStorage.removeItem('dataroom_token');
    setToken(null);
    setUser(null);
    window.location.href = '/login';
  };

  const switchUser = async (targetRole: 'admin' | 'staff' | 'manager') => {
    if (targetRole === 'admin') {
      await login('admin@dataroom.local', 'Admin@123');
    } else if (targetRole === 'staff') {
      await login('staff@dataroom.local', 'Staff@123');
    } else {
      await login('manager@dataroom.local', 'Staff@123');
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, switchUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
