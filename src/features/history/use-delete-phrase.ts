import { apiFetch, AuthError } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useCallback } from 'react';
import { useSWRConfig } from 'swr';
import type { Phrase } from './types';

export function useDeletePhrase() {
    const { mutate } = useSWRConfig();
    const { signOut } = useAuth();

    const handleDeletePhrase = useCallback(
        async (phraseId: string) => {
            const cacheKey = 'phrases';

            // Optimistic: drop it from the list immediately
            const previous = await mutate<Phrase[]>(
                cacheKey,
                (current) => (current ?? []).filter((p) => p.id !== phraseId),
                false
            );

            try {
                const res = await apiFetch(`/phrases/${phraseId}`, { method: 'DELETE' });

                if (!res.ok) {
                    throw new Error(`Delete failed: ${res.status}`);
                }

                // Server returns the deleted Phrase — no need to refetch.
                await mutate(cacheKey);
            } catch (err) {
                // Dead token: signing out also clears the cache, so there is nothing to roll back.
                if (err instanceof AuthError) {
                    await signOut();
                    return;
                }

                // Roll back on failure
                await mutate(cacheKey, previous, false);
                throw err;
            }
        },
        [mutate, signOut]
    );

    return { handleDeletePhrase };
}
