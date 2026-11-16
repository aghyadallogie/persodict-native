import { apiFetch, AuthError } from '@/lib/api';
import type { HistoryRepository } from './repository';
import type { Phrase } from './types';

const MAX_RETRIES = 3;

export class ApiHistoryRepository implements HistoryRepository {
    async listHistory(): Promise<Phrase[]> {
        let lastError: unknown;

        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
                const res = await apiFetch('/phrases');

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
