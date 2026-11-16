import * as SecureStore from 'expo-secure-store';
import { apiFetch, AuthError, SESSION_KEY } from '@/lib/api';

jest.mock('expo-secure-store', () => ({
    getItemAsync: jest.fn(),
}));

const getItem = SecureStore.getItemAsync as jest.Mock;
const fetchMock = jest.fn();

function response(status: number): Response {
    return { status, ok: status >= 200 && status < 300 } as Response;
}

beforeEach(() => {
    jest.resetAllMocks();
    globalThis.fetch = fetchMock as unknown as typeof fetch;
});

describe('apiFetch', () => {
    it('throws AuthError without calling the network when there is no token', async () => {
        getItem.mockResolvedValue(null);

        await expect(apiFetch('/phrases')).rejects.toBeInstanceOf(AuthError);
        expect(getItem).toHaveBeenCalledWith(SESSION_KEY);
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('prefixes the base URL and sends the bearer token and JSON content type', async () => {
        getItem.mockResolvedValue('token-123');
        fetchMock.mockResolvedValue(response(200));

        await apiFetch('/phrases');

        expect(fetchMock).toHaveBeenCalledTimes(1);
        const [url, init] = fetchMock.mock.calls[0];
        expect(url).toBe(`${process.env.EXPO_PUBLIC_API_URL}/phrases`);
        expect(init.headers).toEqual({
            Authorization: 'Bearer token-123',
            'Content-Type': 'application/json',
        });
    });

    it('passes method and body through and lets callers add or override headers', async () => {
        getItem.mockResolvedValue('token-123');
        fetchMock.mockResolvedValue(response(200));

        await apiFetch('/settings', {
            method: 'POST',
            body: '{"a":1}',
            headers: { 'X-Test': '1', 'Content-Type': 'text/plain' },
        });

        const [, init] = fetchMock.mock.calls[0];
        expect(init.method).toBe('POST');
        expect(init.body).toBe('{"a":1}');
        expect(init.headers).toEqual({
            Authorization: 'Bearer token-123',
            'Content-Type': 'text/plain',
            'X-Test': '1',
        });
    });

    it('throws AuthError when the server answers 401', async () => {
        getItem.mockResolvedValue('expired');
        fetchMock.mockResolvedValue(response(401));

        await expect(apiFetch('/phrases')).rejects.toBeInstanceOf(AuthError);
    });

    it.each([200, 404, 500])('returns a %i response untouched for the caller to handle', async (status) => {
        getItem.mockResolvedValue('token-123');
        const res = response(status);
        fetchMock.mockResolvedValue(res);

        await expect(apiFetch('/phrases')).resolves.toBe(res);
    });

    it('propagates network failures', async () => {
        getItem.mockResolvedValue('token-123');
        fetchMock.mockRejectedValue(new TypeError('Network request failed'));

        await expect(apiFetch('/phrases')).rejects.toThrow('Network request failed');
    });
});
