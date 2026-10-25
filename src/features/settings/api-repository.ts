import { AuthError } from '@/features/history/api-repository';
import * as SecureStore from 'expo-secure-store';
import type { SettingsResponse, UserSettings } from './types';

const SESSION_KEY = 'persodict_session';

async function authHeaders(): Promise<Record<string, string>> {
    const token = await SecureStore.getItemAsync(SESSION_KEY);
    if (!token) throw new AuthError();
    return {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
    };
}

/** Normalizes both possible envelopes from GET /settings. */
function unwrap(body: SettingsResponse): UserSettings {
    if ('data' in body && body.data) return body.data;
    return body as UserSettings;
}

export async function fetchSettings(): Promise<UserSettings> {
    const headers = await authHeaders();
    const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/settings`, { headers });

    if (res.status === 401) throw new AuthError();
    if (res.status === 404) {
        // New user with no settings yet — treat as empty
        return { userId: '', userLangs: [] };
    }
    if (!res.ok) throw new Error(`Failed to load settings: ${res.status}`);

    return unwrap((await res.json()) as SettingsResponse);
}

export async function saveSettings(
    userId: string,
    userLangs: string[]
): Promise<UserSettings> {
    const headers = await authHeaders();
    const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/settings`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ userId, userLangs }),
    });

    if (res.status === 401) throw new AuthError();
    if (!res.ok) throw new Error(`Failed to save settings: ${res.status}`);

    return unwrap((await res.json()) as SettingsResponse);
}