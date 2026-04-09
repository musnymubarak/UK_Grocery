/**
 * Auth context — manages JWT token, user state, login/logout.
 */
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { authApi } from '../../services/api';
import type { User } from '../../types';

interface AuthContextType {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isAdmin: boolean;
    isManager: boolean;
    isCashier: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Load from localStorage on mount
    useEffect(() => {
        const savedToken = localStorage.getItem('pos_token');
        const savedUser = localStorage.getItem('pos_user');
        if (savedToken && savedUser) {
            setToken(savedToken);
            setUser(JSON.parse(savedUser));
        }
        setIsLoading(false);
    }, []);

    const login = useCallback(async (email: string, password: string) => {
        const response = await authApi.login(email, password);
        const { access_token, user: userData } = response.data;

        localStorage.setItem('pos_token', access_token);
        localStorage.setItem('pos_user', JSON.stringify(userData));
        setToken(access_token);
        setUser(userData);
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem('pos_token');
        localStorage.removeItem('pos_user');
        setToken(null);
        setUser(null);
    }, []);

    const refreshUser = useCallback(async () => {
        try {
            const response = await authApi.me();
            setUser(response.data);
            localStorage.setItem('pos_user', JSON.stringify(response.data));
        } catch {
            logout();
        }
    }, [logout]);

    const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
    const isManager = user?.role === 'manager';
    const isCashier = user?.role === 'cashier';

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                isAuthenticated: !!token && !!user,
                isAdmin,
                isManager,
                isCashier,
                isLoading,
                login,
                logout,
                refreshUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextType {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
}
