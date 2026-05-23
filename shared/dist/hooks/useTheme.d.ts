export type Theme = 'light' | 'dark';
export interface ThemeContextValue {
    theme: Theme;
    toggle: () => void;
}
export declare function useTheme(): ThemeContextValue;
export declare function ThemeProvider({ children }: {
    children: React.ReactNode;
}): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=useTheme.d.ts.map