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
            try {
                await mutate<Phrase[]>(
                    'phrases',
                    async (): Promise<undefined> => {
                        const res = await apiFetch(`/phrases/${phraseId}`, { method: 'DELETE' });
                        if (!res.ok) throw new Error(`Delete failed: ${res.status}`);
                        // The response isn't written to the cache (populateCache: false);
                        // the revalidation below refetches the list instead.
                        return undefined;
                    },
                    {
                        // Drop it from the list immediately; SWR restores the previous list if
                        // the request throws.
                        optimisticData: (current) => (current ?? []).filter((p) => p.id !== phraseId),
                        rollbackOnError: true,
                        populateCache: false,
                        revalidate: true,
                    }
                );
            } catch (err) {
                // Dead token: signing out also clears the cache, so there is nothing to keep.
                if (err instanceof AuthError) {
                    await signOut();
                    return;
                }
                throw err;
            }
        },
        [mutate, signOut]
    );

    return { handleDeletePhrase };
}
