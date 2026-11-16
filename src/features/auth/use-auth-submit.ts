import { useState } from 'react';

/**
 * Submitting/error state shared by the login and register forms.
 *
 * `run(action)` clears the previous error, flags `submitting` while `action` runs, and
 * turns a thrown error into a message (the error's own message, else `fallbackMessage`).
 * `setError` is exposed so a form can report its own client-side validation errors.
 */
export function useAuthSubmit(fallbackMessage: string) {
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const run = async (action: () => Promise<void>) => {
        setError(null);
        setSubmitting(true);
        try {
            await action();
        } catch (e) {
            setError(e instanceof Error ? e.message : fallbackMessage);
        } finally {
            setSubmitting(false);
        }
    };

    return { submitting, error, setError, run };
}
