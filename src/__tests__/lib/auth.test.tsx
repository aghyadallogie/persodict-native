import { SESSION_KEY } from '@/lib/api';
import { AuthProvider, useAuth } from '@/lib/auth';
import { getGoogleIdToken, signOutOfGoogle } from '@/lib/google-auth';
import { act, renderHook } from '@testing-library/react-native';
import * as SecureStore from 'expo-secure-store';
import type { ReactNode } from 'react';

jest.mock('expo-secure-store', () => ({
    getItemAsync: jest.fn(),
    setItemAsync: jest.fn(),
    deleteItemAsync: jest.fn(),
}));
jest.mock('@/lib/google-auth', () => ({
    getGoogleIdToken: jest.fn(),
    signOutOfGoogle: jest.fn(),
}));

const store = SecureStore as jest.Mocked<typeof SecureStore>;
const getIdToken = getGoogleIdToken as jest.Mock;
const googleSignOut = signOutOfGoogle as jest.Mock;
const fetchMock = jest.fn();

function wrapper({ children }: { children: ReactNode }) {
    return <AuthProvider>{children}</AuthProvider>;
}

/** Renders the provider and waits for the initial SecureStore read to finish. */
async function setup() {
    const rendered = await renderHook(() => useAuth(), { wrapper });
    await act(async () => {});
    return rendered.result;
}

function jsonResponse(status: number, body?: unknown) {
    return { status, ok: status >= 200 && status < 300, json: async () => body };
}

beforeEach(() => {
    jest.resetAllMocks();
    store.getItemAsync.mockResolvedValue(null);
    store.setItemAsync.mockResolvedValue(undefined);
    store.deleteItemAsync.mockResolvedValue(undefined);
    googleSignOut.mockResolvedValue(undefined);
    globalThis.fetch = fetchMock as unknown as typeof fetch;
});

describe('signInWithGoogle', () => {
    it('sends the ID token to the backend and starts a session with the returned token', async () => {
        getIdToken.mockResolvedValue('google-id-token');
        fetchMock.mockResolvedValue(
            jsonResponse(201, { id: 'u1', email: 'a@b.co', token: 'app-jwt' })
        );
        const result = await setup();

        await act(() => result.current.signInWithGoogle());

        const [url, init] = fetchMock.mock.calls[0];
        expect(url).toBe(`${process.env.EXPO_PUBLIC_API_URL}/auth/google`);
        expect(init.method).toBe('POST');
        expect(JSON.parse(init.body)).toEqual({ idToken: 'google-id-token' });
        expect(store.setItemAsync).toHaveBeenCalledWith(SESSION_KEY, 'app-jwt');
        expect(result.current.session).toBe('app-jwt');
    });

    it('does nothing, and shows no error, when the user cancels the Google picker', async () => {
        getIdToken.mockResolvedValue(null);
        const result = await setup();

        await act(() => result.current.signInWithGoogle());

        expect(fetchMock).not.toHaveBeenCalled();
        expect(store.setItemAsync).not.toHaveBeenCalled();
        expect(result.current.session).toBeNull();
    });

    it('passes on the failure message when Google itself fails', async () => {
        getIdToken.mockRejectedValue(new Error('Google Play Services is missing'));
        const result = await setup();

        await act(async () => {
            await expect(result.current.signInWithGoogle()).rejects.toThrow(
                'Google Play Services is missing'
            );
        });
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it.each([
        [401, undefined, 'Google sign-in was rejected. Please try again.'],
        [400, { message: 'Email not verified' }, 'Email not verified'],
        [400, undefined, 'Google sign-in failed'],
        [400, { message: ['a is bad', 'b is bad'] }, 'a is bad\nb is bad'],
        [500, undefined, 'Google sign-in failed. Try again later'],
    ])('maps a %i response to a readable error', async (status, body, message) => {
        getIdToken.mockResolvedValue('google-id-token');
        fetchMock.mockResolvedValue(jsonResponse(status, body));
        const result = await setup();

        await act(async () => {
            await expect(result.current.signInWithGoogle()).rejects.toThrow(message);
        });
        expect(store.setItemAsync).not.toHaveBeenCalled();
        expect(result.current.session).toBeNull();
    });

    it('fails when the backend answers without a token', async () => {
        getIdToken.mockResolvedValue('google-id-token');
        fetchMock.mockResolvedValue(jsonResponse(201, { id: 'u1', email: 'a@b.co' }));
        const result = await setup();

        await act(async () => {
            await expect(result.current.signInWithGoogle()).rejects.toThrow(
                'Google sign-in response did not contain a token'
            );
        });
        expect(result.current.session).toBeNull();
    });

    it('reports a network failure', async () => {
        getIdToken.mockResolvedValue('google-id-token');
        fetchMock.mockRejectedValue(new TypeError('Network request failed'));
        const result = await setup();

        await act(async () => {
            await expect(result.current.signInWithGoogle()).rejects.toThrow(
                'Network error. Check your connection.'
            );
        });
    });
});

describe('signOut', () => {
    it('clears the stored token and the session, and signs out of Google too', async () => {
        store.getItemAsync.mockResolvedValue('existing-jwt');
        const result = await setup();
        expect(result.current.session).toBe('existing-jwt');

        await act(() => result.current.signOut());

        expect(store.deleteItemAsync).toHaveBeenCalledWith(SESSION_KEY);
        expect(googleSignOut).toHaveBeenCalledTimes(1);
        expect(result.current.session).toBeNull();
    });
});
