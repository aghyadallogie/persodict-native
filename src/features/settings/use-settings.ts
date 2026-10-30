import { useAccount } from '@/features/account/use-account';
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
    const { id: accountId } = useAccount();
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

            // New users have no settings yet (data.userId is ''), so use the account id;
            // saving under '' would orphan the settings and break translate with a 404.
            const userId = data.userId || accountId;
            if (!userId) {
                setToggleError('Could not identify your account. Please try again.');
                return;
            }

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
                setToggleError('Remember, you need at least one language!');
            } finally {
                setSavingCode(null);
            }
        },
        [data, accountId, userLangs, savingCode, mutate, signOut]
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