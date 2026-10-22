import { useAuth } from '@/lib/auth';
import * as SecureStore from 'expo-secure-store';
import { useCallback } from 'react';
import { useSWRConfig } from 'swr';
import type { Phrase } from './types';

const SESSION_KEY = 'persodict_session';

export function useDeletePhrase() {
    const { mutate } = useSWRConfig();
    const { signOut } = useAuth();

    const handleDeletePhrase = useCallback(
        async (phraseId: string) => {
            const token = await SecureStore.getItemAsync(SESSION_KEY);
            if (!token) {
                await signOut();
                return;
            }

            const cacheKey = 'phrases';

            // Optimistic: drop it from the list immediately
            const previous = await mutate<Phrase[]>(
                cacheKey,
                (current) => (current ?? []).filter((p) => p.id !== phraseId),
                false
            );

            try {
                const res = await fetch(
                    `${process.env.EXPO_PUBLIC_API_URL}/phrases/${phraseId}`,
                    {
                        method: 'DELETE',
                        headers: {
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        },
                    }
                );

                if (res.status === 401) {
                    await signOut();
                    return;
                }
                if (!res.ok) {
                    throw new Error(`Delete failed: ${res.status}`);
                }

                // Server returns the deleted Phrase — no need to refetch.
                await mutate(cacheKey);
            } catch (err) {
                // Roll back on failure
                await mutate(cacheKey, previous, false);
                throw err;
            }
        },
        [mutate, signOut]
    );

    return { handleDeletePhrase };
}