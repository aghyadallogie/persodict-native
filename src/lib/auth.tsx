import * as SecureStore from 'expo-secure-store';
import {
    createContext,
    ReactNode,
    useCallback,
    useContext,
    useEffect,
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

// Matches AuthResult from the NestJS AuthService
type AuthResult = { id: string; email: string; token: string };

export function AuthProvider({ children }: { children: ReactNode }) {
    const [session, setSession] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        SecureStore.getItemAsync(SESSION_KEY)
            .then((token) => setSession(token))
            .finally(() => setIsLoading(false));
    }, []);

    const signIn = useCallback(async (email: string, password: string) => {
        const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        if (!res.ok) {
            if (res.status === 401) throw new Error('Invalid email or password');
            throw new Error(`Login failed (${res.status})`);
        }

        const body = (await res.json()) as AuthResult;

        if (!body?.token) throw new Error('Login response did not contain a token');

        await SecureStore.setItemAsync(SESSION_KEY, body.token);
        setSession(body.token);
    }, []);

    const signOut = useCallback(async () => {
        await SecureStore.deleteItemAsync(SESSION_KEY);
        setSession(null);
    }, []);

    return (
        <AuthContext.Provider value={{ session, isLoading, signIn, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}