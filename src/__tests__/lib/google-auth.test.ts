import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';

// The Google module is mocked globally in jest.setup.js; this file drives it per test. The helper
// keeps a module-level "configured" flag, so each test loads a fresh copy.
const signIn = GoogleSignin.signIn as jest.Mock;
const hasPlayServices = GoogleSignin.hasPlayServices as jest.Mock;
const configure = GoogleSignin.configure as jest.Mock;
const signOut = GoogleSignin.signOut as jest.Mock;

function loadHelper() {
    let helper!: typeof import('@/lib/google-auth');
    jest.isolateModules(() => {
        helper = jest.requireActual('@/lib/google-auth');
    });
    return helper;
}

const success = (idToken: string | null) => ({ type: 'success', data: { idToken } });

beforeEach(() => {
    jest.clearAllMocks();
    hasPlayServices.mockResolvedValue(true);
    signIn.mockResolvedValue(success('google-id-token'));
    signOut.mockResolvedValue(null);
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID = 'web-client-id.apps.googleusercontent.com';
});

describe('getGoogleIdToken', () => {
    it("resolves to the user's Google ID token", async () => {
        const { getGoogleIdToken } = loadHelper();

        await expect(getGoogleIdToken()).resolves.toBe('google-id-token');
    });

    it('configures Google once, with the Web client ID', async () => {
        const { getGoogleIdToken } = loadHelper();

        await getGoogleIdToken();
        await getGoogleIdToken();

        expect(configure).toHaveBeenCalledTimes(1);
        expect(configure).toHaveBeenCalledWith({
            webClientId: 'web-client-id.apps.googleusercontent.com',
        });
    });

    it('checks Play Services first, offering the update dialog', async () => {
        const { getGoogleIdToken } = loadHelper();

        await getGoogleIdToken();

        expect(hasPlayServices).toHaveBeenCalledWith({ showPlayServicesUpdateDialog: true });
        expect(hasPlayServices.mock.invocationCallOrder[0]).toBeLessThan(
            signIn.mock.invocationCallOrder[0]
        );
    });

    it('resolves to null (no error) when the user cancels the picker', async () => {
        signIn.mockResolvedValue({ type: 'cancelled', data: null });
        const { getGoogleIdToken } = loadHelper();

        await expect(getGoogleIdToken()).resolves.toBeNull();
    });

    it.each([statusCodes.IN_PROGRESS, statusCodes.SIGN_IN_CANCELLED])(
        'resolves to null for the %s status',
        async (code) => {
            signIn.mockRejectedValue({ code });
            const { getGoogleIdToken } = loadHelper();

            await expect(getGoogleIdToken()).resolves.toBeNull();
        }
    );

    it('explains when Google Play Services is unavailable', async () => {
        hasPlayServices.mockRejectedValue({ code: statusCodes.PLAY_SERVICES_NOT_AVAILABLE });
        const { getGoogleIdToken } = loadHelper();

        await expect(getGoogleIdToken()).rejects.toThrow(
            'Google Play Services is missing or out of date on this device'
        );
        expect(signIn).not.toHaveBeenCalled();
    });

    it('turns any other failure into a generic message', async () => {
        signIn.mockRejectedValue(new Error('DEVELOPER_ERROR 10'));
        const { getGoogleIdToken } = loadHelper();

        await expect(getGoogleIdToken()).rejects.toThrow(
            'Google sign-in failed. Please try again.'
        );
    });

    it('fails clearly when Google returns no ID token', async () => {
        signIn.mockResolvedValue(success(null));
        const { getGoogleIdToken } = loadHelper();

        await expect(getGoogleIdToken()).rejects.toThrow('Google did not return an ID token');
    });

    it('fails clearly, without opening Google, when the Web client ID is not configured', async () => {
        delete process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
        const { getGoogleIdToken } = loadHelper();

        await expect(getGoogleIdToken()).rejects.toThrow('Google sign-in is not configured');
        expect(signIn).not.toHaveBeenCalled();
    });
});

describe('signOutOfGoogle', () => {
    it('signs out of the Google account on the device', async () => {
        const { signOutOfGoogle } = loadHelper();

        await signOutOfGoogle();

        expect(signOut).toHaveBeenCalledTimes(1);
    });

    it('never throws, so it cannot block signing out of the app', async () => {
        signOut.mockRejectedValue(new Error('native module missing'));
        const { signOutOfGoogle } = loadHelper();

        await expect(signOutOfGoogle()).resolves.toBeUndefined();
    });
});
