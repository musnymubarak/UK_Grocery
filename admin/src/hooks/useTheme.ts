import { useEffect, useState } from 'react';

export type Theme = 'light' | 'dark';
const KEY = 'pos_theme';

export function getInitialTheme(): Theme {
    if (typeof localStorage !== 'undefined') {
        const saved = localStorage.getItem(KEY);
        if (saved === 'dark' || saved === 'light') return saved;
    }
    return 'light';
}

export function applyTheme(theme: Theme) {
    const el = document.documentElement;
    el.classList.toggle('dark', theme === 'dark');
    el.setAttribute('data-theme', theme);
}

/** Dark-mode controller. State is local but the effect mutates <html> globally. */
export function useTheme() {
    const [theme, setTheme] = useState<Theme>(getInitialTheme);

    useEffect(() => {
        applyTheme(theme);
        localStorage.setItem(KEY, theme);
    }, [theme]);

    const toggle = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
    return { theme, setTheme, toggle };
}
