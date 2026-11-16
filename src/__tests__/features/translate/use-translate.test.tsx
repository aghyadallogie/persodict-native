import type { Phrase } from '@/features/history/types';
import { useSettings } from '@/features/settings/use-settings';
import { useSubmitTranslate } from '@/features/translate/use-translate';
import { apiFetch, AuthError } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { act, renderHook } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import useSWR, { SWRConfig } from 'swr';

jest.mock('@/lib/api', () => ({
    ...jest.requireActual('@/lib/api'),
    apiFetch: jest.fn(),
}));
jest.mock('@/lib/auth', () => ({ useAuth: jest.fn() }));
jest.mock('@/features/settings/use-settings', () => ({ useSettings: jest.fn() }));

const apiFetchMock = apiFetch as jest.Mock;
const signOut = jest.fn();

const existing: Phrase = { id: '1', authorId: 'u1', translations: { de: 'Hallo' } };
const created: Phrase = { id: '2', authorId: 'u1', translations: { de: 'Welt' } };

/** Stands in for the backend history list. */
let server: Phrase[];

function wrapper({ children }: { children: ReactNode }) {
    return (
        <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>{children}</SWRConfig>
    );
}

type Harness = {
    translate: ReturnType<typeof useSubmitTranslate>;
    history: Phrase[] | undefined;
};

/** Polls inside `act` so SWR's async updates get rendered (RNTL's waitFor polls outside it). */
async function eventually(assertion: () => void) {
    let lastError: unknown;
    for (let attempt = 0; attempt < 50; attempt++) {
        try {
            assertion();
            return;
        } catch (e) {
            lastError = e;
        }
        await act(async () => {
            await new Promise((resolve) => setTimeout(resolve, 10));
        });
    }
    throw lastError;
}

/** Renders the translate hook next to a live 'phrases' subscription, like the home screen does. */
async function setup() {
    let latest!: Harness;
    await renderHook(
        () => {
            // Read during render so SWR re-renders when the list changes.
            const { data } = useSWR<Phrase[]>('phrases', async () => [...server]);
            latest = { translate: useSubmitTranslate(), history: data };
        },
        { wrapper }
    );
    const current = () => latest;
    await eventually(() => expect(current().history).toHaveLength(server.length));
    return { current };
}

beforeEach(() => {
    server = [existing];
    apiFetchMock.mockReset();
    signOut.mockReset();
    (useAuth as jest.Mock).mockReturnValue({ session: 'token', signOut });
    (useSettings as jest.Mock).mockReturnValue({ userLangs: ['de'] });
    jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
    jest.restoreAllMocks();
});

describe('useSubmitTranslate.handleSubmit', () => {
    it('resolves true, exposes the result and adds the phrase to the history cache', async () => {
        apiFetchMock.mockImplementation(async () => {
            server = [...server, created];
            return { ok: true, status: 201, text: async () => JSON.stringify(created) };
        });
        const { current } = await setup();

        let ok: boolean | undefined;
        await act(async () => {
            ok = await current().translate.handleSubmit('world');
        });

        expect(ok).toBe(true);
        expect(apiFetchMock).toHaveBeenCalledWith('/phrases/translate', {
            method: 'POST',
            body: JSON.stringify({ text: 'world' }),
        });
        expect(current().translate.result).toEqual(created);
        expect(current().translate.error).toBeNull();
        await eventually(() => expect(current().history?.map((p) => p.id)).toEqual(['1', '2']));
    });

    it('resolves false and shows an error when the server rejects the translation', async () => {
        apiFetchMock.mockResolvedValue({
            ok: false,
            status: 500,
            statusText: 'Server Error',
            text: async () => 'boom',
        });
        const { current } = await setup();

        let ok: boolean | undefined;
        await act(async () => {
            ok = await current().translate.handleSubmit('world');
        });

        expect(ok).toBe(false);
        expect(current().translate.error).toBe('Translation failed. Please try again.');
        expect(current().translate.result).toBeNull();
        expect(current().history).toEqual([existing]);
    });

    it('resolves false without calling the API when no language is selected', async () => {
        (useSettings as jest.Mock).mockReturnValue({ userLangs: [] });
        const { current } = await setup();

        let ok: boolean | undefined;
        await act(async () => {
            ok = await current().translate.handleSubmit('world');
        });

        expect(ok).toBe(false);
        expect(apiFetchMock).not.toHaveBeenCalled();
        expect(current().translate.error).toBe('Please select at least one language');
    });

    it('signs out and resolves false when the token is rejected', async () => {
        apiFetchMock.mockRejectedValue(new AuthError());
        const { current } = await setup();

        let ok: boolean | undefined;
        await act(async () => {
            ok = await current().translate.handleSubmit('world');
        });

        expect(ok).toBe(false);
        expect(signOut).toHaveBeenCalledTimes(1);
        expect(current().translate.error).toBeNull();
    });
});
