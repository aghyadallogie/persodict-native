import { useState } from 'react';

/** Which action is running; lets one form show a spinner on the right button. */
export type AuthAction = 'form' | 'google';

/**
 * Submitting/error state shared by the login and register forms.
 *
 * `run(action, kind)` clears the previous error, flags the screen as submitting (`pending` says
 * which `kind`) while `action` runs, and turns a thrown error into a message (the error's own
 * message, else `fallbackMessage`). Only one action runs at a time: `submitting` is true for
 * any of them, so callers disable every button while it is. `setError` is exposed so a form can
 * report its own client-side validation errors.
 */
export function useAuthSubmit(fallbackMessage: string) {
    const [pending, setPending] = useState<AuthAction | null>(null);
    const [error, setError] = useState<string | null>(null);

    const run = async (action: () => Promise<void>, kind: AuthAction = 'form') => {
        setError(null);
        setPending(kind);
        try {
            await action();
        } catch (e) {
            setError(e instanceof Error ? e.message : fallbackMessage);
        } finally {
            setPending(null);
        }
    };

    return { submitting: pending !== null, pending, error, setError, run };
}
