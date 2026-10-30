import { AuthError } from '@/features/history/api-repository';
import { useAuth } from '@/lib/auth';
import { useEffect } from 'react';
import useSWR from 'swr';

type Account = { id: string | null; email: string | null };

type MeBody = {
    id?: string;
    userId?: string;
    sub?: string;
    email?: string;
    user?: { id?: string; email?: string };
};

async function fetchAccount(token: string): Promise<Account> {
    const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
    });

    if (res.status === 401) throw new AuthError();
    if (!res.ok) throw new Error(`Failed to load account: ${res.status}`);

    const body = (await res.json()) as MeBody;
    const id = body.id ?? body.userId ?? body.sub ?? body.user?.id ?? null;
    const email = body.email ?? body.user?.email ?? null;
    if (!id && !email) throw new Error('Account response did not contain an id or email');

    return { id, email };
}

export function useAccount() {
    const { session, signOut } = useAuth();

    // Keyed by token so a different login never shows the previous user's email.
    const { data, error, isLoading } = useSWR(
        session ? ['account', session] : null,
        ([, token]) => fetchAccount(token),
        { revalidateOnFocus: false },
    );

    useEffect(() => {
        if (error instanceof AuthError) signOut();
    }, [error, signOut]);

    return { id: data?.id ?? null, email: data?.email ?? null, isLoading };
}
