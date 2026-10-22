import { useAuth } from '@/lib/auth';
import { useEffect } from 'react';
import useSWR from 'swr';
import { AuthError } from './api-repository';
import { historyRepository } from './index';

export function useHistory() {
    const { session, signOut } = useAuth();

    const { data, error, isLoading, mutate } = useSWR(
        session ? 'phrases' : null,
        () => historyRepository.listHistory(),
        { revalidateOnFocus: false }
    );

    // If the token is dead, drop the session so the guard redirects to login.
    useEffect(() => {
        if (error instanceof AuthError) signOut();
    }, [error, signOut]);

    // Mirror the web: newest first
    const orderedTranslations = data ? [...data].reverse() : [];

    return { orderedTranslations, isLoading, isError: error, refresh: mutate };
}