import { Colors } from '@/constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    createContext,
    ReactNode,
    useCallback,
    useContext,
    useEffect,
    useState,
} from 'react';
import { useColorScheme } from 'react-native';

type ThemeMode = 'light' | 'dark' | null;

type ThemeContextType = {
    colors: typeof Colors.light;
    isDark: boolean;
    mode: ThemeMode;
    setMode: (m: ThemeMode) => Promise<void>;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = 'persodict_theme_mode';

export function ThemeProvider({ children }: { children: ReactNode }) {
    const system = useColorScheme();
    const [mode, setModeState] = useState<ThemeMode>(null);
    const [hydrated, setHydrated] = useState(false);

    useEffect(() => {
        AsyncStorage.getItem(STORAGE_KEY)
            .then((stored) => {
                if (stored === 'light' || stored === 'dark') setModeState(stored);
            })
            .finally(() => setHydrated(true));
    }, []);

    const setMode = useCallback(async (m: ThemeMode) => {
        setModeState(m);
        if (m === null) {
            await AsyncStorage.removeItem(STORAGE_KEY);
        } else {
            await AsyncStorage.setItem(STORAGE_KEY, m);
        }
    }, []);

    const effective: 'light' | 'dark' = mode ?? (system === 'dark' ? 'dark' : 'light');
    const isDark = effective === 'dark';
    const colors = isDark ? Colors.dark : Colors.light;

    if (!hydrated) return null;

    return (
        <ThemeContext.Provider value={{ colors, isDark, mode, setMode }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const ctx = useContext(ThemeContext);
    if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
    return ctx;
}