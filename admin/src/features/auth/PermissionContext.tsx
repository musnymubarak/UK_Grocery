/**
 * PermissionContext — UI-capability RBAC. Fetches the current user's resolved
 * capabilities + hidden pages from /auth/me and exposes `can()` / `isHidden()`.
 * Admin/super_admin are always allowed (backstop; backend role checks remain).
 */
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authApi } from '../../services/api';
import { useAuth } from './AuthContext';

interface PermissionState {
    capabilities: string[];
    hiddenPages: string[];
    role: string | null;
    loaded: boolean;
}
interface PermissionContextType extends PermissionState {
    can: (capability: string) => boolean;
    isHidden: (path: string) => boolean;
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

export function PermissionProvider({ children }: { children: ReactNode }) {
    const { token, user } = useAuth();
    const [state, setState] = useState<PermissionState>({ capabilities: [], hiddenPages: [], role: null, loaded: false });

    useEffect(() => {
        let active = true;
        if (!token) { setState({ capabilities: [], hiddenPages: [], role: null, loaded: false }); return; }
        authApi.me()
            .then((res) => { if (active) setState({ capabilities: res.data.capabilities ?? [], hiddenPages: res.data.hidden_pages ?? [], role: res.data.role ?? null, loaded: true }); })
            .catch(() => { if (active) setState((s) => ({ ...s, loaded: true })); });
        return () => { active = false; };
    }, [token]);

    const privileged = user?.role === 'admin' || user?.role === 'super_admin';
    const can = (capability: string) => {
        if (!state.loaded) return true;     // never hide while still loading
        if (privileged) return true;        // backstop: admins keep full access
        return state.capabilities.includes(capability);
    };
    const isHidden = (path: string) => state.loaded && !privileged && state.hiddenPages.includes(path);

    return <PermissionContext.Provider value={{ ...state, can, isHidden }}>{children}</PermissionContext.Provider>;
}

export function usePermissions(): PermissionContextType {
    const ctx = useContext(PermissionContext);
    if (!ctx) throw new Error('usePermissions must be used within a PermissionProvider');
    return ctx;
}
