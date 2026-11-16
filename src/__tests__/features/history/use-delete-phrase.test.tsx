import type { Phrase } from '@/features/history/types';
import { useDeletePhrase } from '@/features/history/use-delete-phrase';
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

const apiFetchMock = apiFetch as jest.Mock;
const signOut = jest.fn();

const phrase = (id: string): Phrase => ({ id, authorId: 'u1', translations: { de: id } });

/** Stands in for the backend: the list the history fetcher returns. */
let server: Phrase[];

function wrapper({ children }: { children: ReactNode }) {
    return (
        <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>{children}</SWRConfig>
    );
}

/**
 * Retries `assertion` until it passes, letting React flush inside `act` between attempts.
 * (RNTL's `waitFor` polls outside `act`, so SWR's async updates never render.)
 */
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

type Harness = { del: ReturnType<typeof useDeletePhrase>; history: { data?: Phrase[] } };

/**
 * Renders the delete hook next to a live 'phrases' SWR subscription. `current()` reads the
 * latest render directly, because RNTL's `result` ref lags behind updates that come from SWR.
 */
async function setup() {
    let latest!: Harness;
    await renderHook(
        () => {
            // Destructure during render: SWR only re-renders for fields read in render.
            const { data } = useSWR<Phrase[]>('phrases', async () => [...server]);
            latest = { del: useDeletePhrase(), history: { data } };
        },
        { wrapper }
    );
    const current = () => latest;
    await eventually(() => expect(current().history.data).toHaveLength(server.length));
    return { current };
}

const ids = (data?: Phrase[]) => data?.map((p) => p.id);

beforeEach(() => {
    server = [phrase('1'), phrase('2'), phrase('3')];
    apiFetchMock.mockReset();
    signOut.mockReset();
    (useAuth as jest.Mock).mockReturnValue({ signOut });
});

describe('useDeletePhrase', () => {
    it('removes the phrase and keeps it removed after the server confirms', async () => {
        apiFetchMock.mockImplementation(async () => {
            server = server.filter((p) => p.id !== '2');
            return { ok: true, status: 200 };
        });
        const { current } = await setup();

        await act(() => current().del.handleDeletePhrase('2'));

        expect(apiFetchMock).toHaveBeenCalledWith('/phrases/2', { method: 'DELETE' });
        await eventually(() => expect(ids(current().history.data)).toEqual(['1', '3']));
    });

    it('rolls the list back and rethrows when the server rejects the delete', async () => {
        apiFetchMock.mockResolvedValue({ ok: false, status: 500 });
        const { current } = await setup();

        await act(async () => {
            await expect(current().del.handleDeletePhrase('2')).rejects.toThrow(
                'Delete failed: 500'
            );
        });

        expect(ids(current().history.data)).toEqual(['1', '2', '3']);
    });

    it('rolls the list back when the request itself fails (offline)', async () => {
        apiFetchMock.mockRejectedValue(new TypeError('Network request failed'));
        const { current } = await setup();

        await act(async () => {
            await expect(current().del.handleDeletePhrase('1')).rejects.toThrow(
                'Network request failed'
            );
        });

        expect(ids(current().history.data)).toEqual(['1', '2', '3']);
    });

    it('signs out instead of throwing when the token is rejected', async () => {
        apiFetchMock.mockRejectedValue(new AuthError());
        const { current } = await setup();

        await act(() => current().del.handleDeletePhrase('2'));

        expect(signOut).toHaveBeenCalledTimes(1);
    });
});
