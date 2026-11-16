import * as SecureStore from 'expo-secure-store';

/** SecureStore key holding the JWT. Shared by `AuthProvider` (writes) and `apiFetch` (reads). */
export const SESSION_KEY = 'persodict_session';

/** Thrown when there is no token or the server answers 401; hooks react by signing out. */
export class AuthError extends Error {
    constructor() {
        super('Not authenticated');
        this.name = 'AuthError';
    }
}

/**
 * `fetch` against the Persodict API for authenticated endpoints.
 *
 * Prefixes the base URL, attaches the stored bearer token and JSON content type, and
 * throws `AuthError` when there is no token or the response is 401. Any other status
 * is returned as-is, so callers decide how to treat 404s, 5xx, etc.
 */
export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
    const token = await SecureStore.getItemAsync(SESSION_KEY);
    if (!token) throw new AuthError();

    const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}${path}`, {
        ...init,
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            ...init.headers,
        },
    });

    if (res.status === 401) throw new AuthError();
    return res;
}
