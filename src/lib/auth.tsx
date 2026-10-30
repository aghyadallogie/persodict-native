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
    signUp: (email: string, password: string, name?: string) => Promise<void>;
    signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_KEY = 'persodict_session';
const AUTH_TIMEOUT_MS = 15_000;

type AuthResult = { id: string; email: string; token: string };

/** POSTs to /auth/<path> with a timeout; throws user-facing errors on network failure. */
async function postAuth(path: 'login' | 'register', payload: object): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), AUTH_TIMEOUT_MS);

    try {
        return await fetch(`${process.env.EXPO_PUBLIC_API_URL}/auth/${path}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal: controller.signal,
        });
    } catch {
        throw new Error(
            controller.signal.aborted
                ? 'Request timed out. Please try again.'
                : 'Network error. Check your connection.',
        );
    } finally {
        clearTimeout(timer);
    }
}

/** Nest validation errors come back as `{ message: string | string[] }`. */
async function serverMessage(res: Response): Promise<string | null> {
    const body = (await res.json().catch(() => null)) as { message?: string | string[] } | null;
    const message = body?.message;
    if (!message) return null;
    return Array.isArray(message) ? message.join('\n') : message;
}

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

    const startSession = useCallback(async (token: string) => {
        await SecureStore.setItemAsync(SESSION_KEY, token);
        setSession(token);
    }, []);

    const signIn = useCallback(
        async (email: string, password: string) => {
            const res = await postAuth('login', { email: email.trim(), password });

            if (!res.ok) {
                if (res.status === 401) throw new Error('Invalid email or password');
                throw new Error(`Login failed. Try again later`);
            }

            const body = (await res.json().catch(() => null)) as AuthResult | null;
            if (!body?.token) throw new Error('Login response did not contain a token');

            await startSession(body.token);
        },
        [startSession],
    );

    const signUp = useCallback(
        async (email: string, password: string, name?: string) => {
            const trimmedName = name?.trim();
            const res = await postAuth('register', {
                email: email.trim(),
                password,
                ...(trimmedName ? { name: trimmedName } : {}),
            });

            if (!res.ok) {
                if (res.status === 409) {
                    throw new Error('An account with this email already exists');
                }
                if (res.status === 400) {
                    throw new Error((await serverMessage(res)) ?? 'Please check your details');
                }
                throw new Error('Sign up failed');
            }

            // Use the token if register returns one; otherwise log in with the new account.
            const body = (await res.json().catch(() => null)) as Partial<AuthResult> | null;
            if (body?.token) {
                await startSession(body.token);
            } else {
                await signIn(email, password);
            }
        },
        [startSession, signIn],
    );

    const signOut = useCallback(async () => {
        try {
            await SecureStore.deleteItemAsync(SESSION_KEY);
        } finally {
            setSession(null);
        }
    }, []);

    const value = useMemo(
        () => ({ session, isLoading, signIn, signUp, signOut }),
        [session, isLoading, signIn, signUp, signOut],
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
