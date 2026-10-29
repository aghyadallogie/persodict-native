import * as SecureStore from 'expo-secure-store';
import {
    createContext,
    ReactNode,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react';

type AuthContextType = {
    session: string | null;
    isLoading: boolean;
    signIn: (email: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_KEY = 'persodict_session';
const LOGIN_TIMEOUT_MS = 15_000;

type AuthResult = { id: string; email: string; token: string };

export function AuthProvider({ children }: { children: ReactNode }) {
    const [session, setSession] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        SecureStore.getItemAsync(SESSION_KEY)
            .then((token) => !cancelled && setSession(token))
            .catch(() => { })
            .finally(() => !cancelled && setIsLoading(false));
        return () => {
            cancelled = true;
        };
    }, []);

    const signIn = useCallback(async (email: string, password: string) => {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), LOGIN_TIMEOUT_MS);

        try {
            let res: Response;
            try {
                res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: email.trim(), password }),
                    signal: controller.signal,
                });
            } catch {
                throw new Error(
                    controller.signal.aborted
                        ? 'Request timed out. Please try again.'
                        : 'Network error. Check your connection.',
                );
            }

            if (!res.ok) {
                if (res.status === 401) throw new Error('Invalid email or password');
                throw new Error('Invalid email or password!');
            }

            const body = (await res.json().catch(() => null)) as AuthResult | null;
            if (!body?.token) throw new Error('Login response did not contain a token');

            await SecureStore.setItemAsync(SESSION_KEY, body.token);
            setSession(body.token);
        } finally {
            clearTimeout(timer);
        }
    }, []);

    const signOut = useCallback(async () => {
        try {
            await SecureStore.deleteItemAsync(SESSION_KEY);
        } finally {
            setSession(null);
        }
    }, []);

    const value = useMemo(
        () => ({ session, isLoading, signIn, signOut }),
        [session, isLoading, signIn, signOut],
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}