import { AuthError } from '@/features/history/api-repository';
import { useAuth } from '@/lib/auth';
import { useCallback, useState } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { fetchSettings, saveSettings } from './api-repository';
import type { UserSettings } from './types';

const KEY = 'settings';

export function useSettings() {
    const { session, signOut } = useAuth();
    const { mutate } = useSWRConfig();
    const [savingCode, setSavingCode] = useState<string | null>(null);
    const [toggleError, setToggleError] = useState<string | null>(null);

    const { data, error, isLoading, mutate: revalidate } = useSWR<UserSettings>(
        session ? KEY : null,
        fetchSettings
    );

    const userLangs = data?.userLangs ?? [];

    const toggleLang = useCallback(
        async (langCode: string) => {
            if (!data || savingCode) return;

            const userId = data.userId || '';
            const next = userLangs.includes(langCode)
                ? userLangs.filter((c) => c !== langCode)
                : [...userLangs, langCode];

            const optimistic: UserSettings = { ...data, userLangs: next };

            setSavingCode(langCode);
            setToggleError(null);

            try {
                await mutate(
                    KEY,
                    async () => saveSettings(userId, next),
                    {
                        optimisticData: optimistic,
                        rollbackOnError: true,
                        populateCache: true,
                        revalidate: false,
                    }
                );
            } catch (e) {
                if (e instanceof AuthError) {
                    await signOut();
                    return;
                }
                setToggleError('Could not save. Please try again.');
            } finally {
                setSavingCode(null);
            }
        },
        [data, userLangs, savingCode, mutate, signOut]
    );

    return {
        settings: data,
        userLangs,
        isLoading,
        hasError: !!error && !(error instanceof AuthError),
        savingCode,
        toggleError,
        toggleLang,
        refresh: revalidate,
    };
}