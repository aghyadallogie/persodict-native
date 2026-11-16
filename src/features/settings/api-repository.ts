import { apiFetch } from '@/lib/api';
import type { SettingsResponse, UserSettings } from './types';

/** Normalizes both possible envelopes from GET /settings. */
function unwrap(body: SettingsResponse): UserSettings {
    if ('data' in body && body.data) return body.data;
    return body as UserSettings;
}

export async function fetchSettings(): Promise<UserSettings> {
    const res = await apiFetch('/settings');

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
    const res = await apiFetch('/settings', {
        method: 'POST',
        body: JSON.stringify({ userId, userLangs }),
    });

    if (!res.ok) throw new Error(`Failed to save settings: ${res.status}`);

    return unwrap((await res.json()) as SettingsResponse);
}
