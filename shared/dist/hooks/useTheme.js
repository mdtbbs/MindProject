'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useEffect, useState } from 'react';
const ThemeContext = createContext({
    theme: 'light',
    toggle: () => { },
});
export function useTheme() {
    return useContext(ThemeContext);
}
function getInitialTheme() {
    if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('theme');
        if (stored === 'dark' || stored === 'light') {
            return stored;
        }
    }
    return 'light';
}
export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState('light');
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
        const initial = getInitialTheme();
        setTheme(initial);
    }, []);
    useEffect(() => {
        if (!mounted)
            return;
        document.documentElement.setAttribute('data-theme', theme);
        document.documentElement.classList.toggle('dark', theme === 'dark');
        localStorage.setItem('theme', theme);
    }, [theme, mounted]);
    const toggle = () => setTheme((t) => (t === 'light' ? 'dark' : 'light'));
    return (_jsx(ThemeContext.Provider, { value: { theme, toggle }, children: children }));
}
