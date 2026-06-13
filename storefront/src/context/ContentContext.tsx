/**
 * ContentContext — admin-editable marketing copy, announcement bar, and branding.
 * Fetches content/announcement/branding from /storefront/app-config once and
 * exposes `t(key, fallback)`, the active `announcement`, and `branding`. Branding
 * colours are applied at runtime by overriding the Tailwind theme CSS variables on
 * <html>, so token-based utilities (bg-primary, text-action-blue, …) recolor live.
 * All fallbacks are the original hardcoded values, so the UI is never broken if a
 * key is missing or the request fails.
 */
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { catalogApi } from '../services/api';

type ContentMap = Record<string, string>;

export interface Announcement {
  key: string;
  message: string;
  link_url: string;
  link_label: string;
  variant: 'info' | 'success' | 'warning' | 'promo';
  dismissible: boolean;
}

export interface Branding {
  app_name: string;
  logo_url: string;
  colors: { primary: string; action: string; accent: string };
}

const DEFAULT_BRANDING: Branding = {
  app_name: 'Daily Grocer',
  logo_url: '',
  colors: { primary: '#001d3d', action: '#e6203a', accent: '#0056b3' },
};

interface ContentContextType {
  t: (key: string, fallback: string) => string;
  content: ContentMap;
  announcement: Announcement | null;
  branding: Branding;
}

const ContentContext = createContext<ContentContextType>({
  t: (_k, f) => f,
  content: {},
  announcement: null,
  branding: DEFAULT_BRANDING,
});

/** Override the Tailwind v4 theme variables so token utilities recolor at runtime. */
function applyBrandingColors(b: Branding) {
  const root = document.documentElement;
  const { primary, action, accent } = b.colors;
  root.style.setProperty('--color-primary', primary);
  root.style.setProperty('--color-primary-container', primary);
  root.style.setProperty('--color-action-red', action);
  root.style.setProperty('--color-action-blue', accent);
  root.style.setProperty('--color-accent', accent);
  root.style.setProperty('--color-info', accent);
}

export function ContentProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<ContentMap>({});
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [branding, setBranding] = useState<Branding>(DEFAULT_BRANDING);

  useEffect(() => {
    let active = true;
    catalogApi
      .getAppConfig()
      .then((res) => {
        if (!active) return;
        setContent(res.data?.content ?? {});
        setAnnouncement(res.data?.announcement ?? null);
        if (res.data?.branding) setBranding({ ...DEFAULT_BRANDING, ...res.data.branding });
      })
      .catch(() => { /* keep defaults → original look, fallbacks render */ });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    applyBrandingColors(branding);
    if (branding.app_name) document.title = branding.app_name;
  }, [branding]);

  const t = (key: string, fallback: string) => {
    const v = content[key];
    return typeof v === 'string' && v.length > 0 ? v : fallback;
  };

  return (
    <ContentContext.Provider value={{ t, content, announcement, branding }}>
      {children}
    </ContentContext.Provider>
  );
}

export function useContent(): ContentContextType {
  return useContext(ContentContext);
}
