/**
 * Customer authentication context for the storefront.
 * Manages JWT tokens, login/register state, and profile data.
 */
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { customerAuthApi, getErrorMessage } from '../services/api';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

interface AuthContextType {
  customer: Customer | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, phone?: string) => Promise<void>;
  logout: () => void;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated = !!customer;

  // Restore session from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem('customer_token');
    const savedCustomer = localStorage.getItem('customer_data');
    if (token && savedCustomer) {
      try {
        setCustomer(JSON.parse(savedCustomer));
      } catch {
        localStorage.removeItem('customer_token');
        localStorage.removeItem('customer_data');
      }
    }
    setIsLoading(false);

    // Listen for auth expiration events from API interceptor
    const handleAuthExpired = () => {
      setCustomer(null);
    };
    window.addEventListener('auth_expired', handleAuthExpired);
    return () => window.removeEventListener('auth_expired', handleAuthExpired);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setError(null);
    setIsLoading(true);
    try {
      const res = await customerAuthApi.login({ email, password });
      const { access_token } = res.data;
      localStorage.setItem('customer_token', access_token);

      // Fetch profile
      const profileRes = await customerAuthApi.getProfile();
      const customerData: Customer = {
        id: profileRes.data.id,
        name: profileRes.data.name,
        email: profileRes.data.email,
        phone: profileRes.data.phone,
      };
      localStorage.setItem('customer_data', JSON.stringify(customerData));
      setCustomer(customerData);
    } catch (err) {
      const msg = getErrorMessage(err, 'Login failed. Please check your credentials.');
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (name: string, email: string, password: string, phone?: string) => {
    setError(null);
    setIsLoading(true);
    try {
      await customerAuthApi.register({ name, email, password, phone });
      // Auto-login after registration
      await login(email, password);
    } catch (err) {
      const msg = getErrorMessage(err, 'Registration failed. Please try again.');
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  }, [login]);

  const logout = useCallback(() => {
    localStorage.removeItem('customer_token');
    localStorage.removeItem('customer_data');
    setCustomer(null);
    setError(null);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return (
    <AuthContext.Provider
      value={{
        customer,
        isAuthenticated,
        isLoading,
        login,
        register,
        logout,
        error,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
