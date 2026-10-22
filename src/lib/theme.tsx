// src/lib/theme.tsx
import { Colors } from '@/constants/theme'; // Your existing colors
import { createContext, ReactNode, useContext } from 'react';
import { useColorScheme } from 'react-native';

type ThemeContextType = {
    colors: typeof Colors.light;
    isDark: boolean;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
    const scheme = useColorScheme();
    const isDark = scheme === 'dark';
    const colors = isDark ? Colors.dark : Colors.light;

    return (
        <ThemeContext.Provider value={{ colors, isDark }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) throw new Error('useTheme must be used within ThemeProvider');
    return context;
}