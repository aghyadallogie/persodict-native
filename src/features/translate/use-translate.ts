import type { Phrase } from '@/features/history/types';
import { apiFetch, AuthError } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useCallback, useState } from 'react';
import { useSWRConfig } from 'swr';
import useSWRMutation from 'swr/mutation';
import { useSettings } from '../settings/use-settings';

async function translateRequest(
  _key: string,
  { arg }: { arg: { text: string } }
): Promise<Phrase> {
  const res = await apiFetch('/phrases/translate', {
    method: 'POST',
    body: JSON.stringify({ text: arg.text }),
  });

  const raw = await res.text();

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
    translateRequest
  );

  const { userLangs } = useSettings();

  const handleSubmit = useCallback(
    /** Resolves to true only when the translation succeeded, so callers can keep the input on failure. */
    async (text: string): Promise<boolean> => {
      if (!session) {
        await signOut();
        return false;
      }
      if (!userLangs.length) {
        setError('Please select at least one language');
        return false;
      }

      setError(null);
      setResult(null);

      try {
        const phrase = await trigger({ text });

        // Put the new phrase straight into the history cache (no refetch) so the result
        // can show immediately, and so home's "result missing from history" check holds.
        await mutate<Phrase[]>(
          'phrases',
          (current) =>
            current?.some((p) => p.id === phrase.id) ? current : [...(current ?? []), phrase],
          { revalidate: false }
        );
        setResult(phrase);

        // Reconcile with the server in the background; the result is already on screen.
        mutate('phrases').catch((e) => console.warn('[translate] history refresh failed:', e));
        return true;
      } catch (e) {
        console.error('[translate] trigger threw:', e);
        if (e instanceof AuthError) {
          await signOut();
          return false;
        }
        setError('Translation failed. Please try again.');
        return false;
      }
    },
    [trigger, mutate, session, signOut, userLangs]
  );

  const clearResult = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return { handleSubmit, isLoading: isMutating, error, result, clearResult };
}