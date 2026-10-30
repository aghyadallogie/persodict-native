import { AuthError } from '@/features/history/api-repository';
import type { Phrase } from '@/features/history/types';
import { useAuth } from '@/lib/auth';
import * as SecureStore from 'expo-secure-store';
import { useCallback, useState } from 'react';
import { useSWRConfig } from 'swr';
import useSWRMutation from 'swr/mutation';
import { useSettings } from '../settings/use-settings';

const SESSION_KEY = 'persodict_session';

async function translateRequest(
  _key: string,
  { arg }: { arg: { text: string } }
): Promise<Phrase> {
  const token = await SecureStore.getItemAsync(SESSION_KEY);
  if (!token) throw new AuthError();

  const url = `${process.env.EXPO_PUBLIC_API_URL}/phrases/translate`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text: arg.text }),
  });

  const raw = await res.text();

  if (res.status === 401) throw new AuthError();
  if (!res.ok) {
    throw new Error(`Translate failed: ${res.status} ${res.statusText} ${raw}`.trim());
  }

  return JSON.parse(raw) as Phrase;
}

export function useSubmitTranslate() {
  const { session, signOut } = useAuth();
  const { mutate } = useSWRConfig();
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Phrase | null>(null);

  const { trigger, isMutating } = useSWRMutation(
    session ? 'translate' : null,
    translateRequest,
    {
      onSuccess: async (data) => {
        try {
          await mutate('phrases');
        } catch (e) {
          console.warn('[translate] mutate phrases failed:', e);
        }
        setResult(data);
      },
      onError: (e) => {
        console.error('[translate] onError:', e);
      },
    }
  );

  const { userLangs } = useSettings();

  const handleSubmit = useCallback(
    async (text: string) => {
      if (!session) return signOut();
      if (!userLangs.length) {
        setError('Please select at least one language');
        return;
      }

      setError(null);
      setResult(null);

      try {
        await trigger({ text });
      } catch (e) {
        console.error('[translate] trigger threw:', e);
        if (e instanceof AuthError) {
          await signOut();
          return;
        }
        setError('Translation failed. Please try again.');
      }
    },
    [trigger, session, signOut, userLangs]
  );

  const clearResult = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return { handleSubmit, isLoading: isMutating, error, result, clearResult };
}