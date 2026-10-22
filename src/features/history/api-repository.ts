import * as SecureStore from 'expo-secure-store';
import type { HistoryRepository } from './repository';
import type { Phrase } from './types';

const SESSION_KEY = 'persodict_session';
const MAX_RETRIES = 3;

export class AuthError extends Error {
    constructor() {
        super('Not authenticated');
        this.name = 'AuthError';
    }
}

export class ApiHistoryRepository implements HistoryRepository {
    async listHistory(): Promise<Phrase[]> {
        const token = await SecureStore.getItemAsync(SESSION_KEY);
        if (!token) throw new AuthError();

        let lastError: unknown;

        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
                const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/phrases`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });

                if (res.status === 401) throw new AuthError();
                if (!res.ok) {
                    throw new Error(`Failed to fetch phrases: ${res.status} ${res.statusText}`);
                }

                // Bare Phrase[] — no envelope
                return (await res.json()) as Phrase[];
            } catch (err) {
                if (err instanceof AuthError) throw err; // don't retry auth failures
                lastError = err;
                if (attempt === MAX_RETRIES) break;
                await new Promise((r) => setTimeout(r, 300 * attempt));
            }
        }

        throw lastError ?? new Error('Failed to fetch phrases');
    }
}