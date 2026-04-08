import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

interface StoreBase {
    id: string;
    name: string;
}

interface AdminStoreContextType {
    selectedStore: StoreBase | null;
    setSelectedStore: (store: StoreBase | null) => void;
}

const AdminStoreContext = createContext<AdminStoreContextType | undefined>(undefined);

const STORAGE_KEY = 'admin_selected_store';

export function AdminStoreProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();

    // Only meaningful for admin/super_admin
    const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

    const [selectedStore, setSelectedStore] = useState<StoreBase | null>(() => {
        if (!isAdmin) return null;
        try {
            const saved = sessionStorage.getItem(STORAGE_KEY);
            return saved ? JSON.parse(saved) : null;
        } catch {
            return null;
        }
    });

    useEffect(() => {
        if (!isAdmin) {
            setSelectedStore(null);
            sessionStorage.removeItem(STORAGE_KEY);
            return;
        }

        if (selectedStore) {
            sessionStorage.setItem(STORAGE_KEY, JSON.stringify(selectedStore));
        } else {
            sessionStorage.removeItem(STORAGE_KEY);
        }
    }, [selectedStore, isAdmin]);

    // If not admin, provide a dummy context that does nothing and always returns null
    // This prevents components from throwing errors if they accidentally consume it when not admin
    if (!isAdmin) {
        return (
            <AdminStoreContext.Provider value={{ selectedStore: null, setSelectedStore: () => { } }}>
                {children}
            </AdminStoreContext.Provider>
        );
    }

    return (
        <AdminStoreContext.Provider value={{ selectedStore, setSelectedStore }}>
            {children}
        </AdminStoreContext.Provider>
    );
}

export function useAdminStore() {
    const context = useContext(AdminStoreContext);
    if (context === undefined) {
        throw new Error('useAdminStore must be used within an AdminStoreProvider');
    }
    return context;
}
