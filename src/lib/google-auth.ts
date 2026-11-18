import { TurboModuleRegistry } from 'react-native';

type GoogleModule = typeof import('@react-native-google-signin/google-signin');

/** Name the library registers its native module under (it appears in the "could not be found" error). */
const NATIVE_MODULE_NAME = 'RNGoogleSignin';

/** Errors we throw ourselves already carry a user-facing message; everything else is wrapped. */
class GoogleAuthError extends Error {}

// undefined = not tried yet, null = this build has no Google native code.
let googleModule: GoogleModule | null | undefined;
let configured = false;

/**
 * Loads the Google Sign-In library on first use. Its native code is only present in a development
 * or production build made after the library was added. In Expo Go (or an older build), evaluating
 * the library throws "RNGoogleSignin could not be found".
 *
 * That throw can NOT be caught with try/catch around `require`: when a module fails while being
 * required at runtime, Metro's loader (`guardedLoadModule`) reports a fatal error (the red screen,
 * or a crash in release) and returns `undefined` instead of rethrowing. So check whether the native
 * module exists first, with the non-throwing `TurboModuleRegistry.get`, and only then require it.
 */
function loadGoogle(): GoogleModule | null {
    if (googleModule === undefined) {
        googleModule = null;
        if (TurboModuleRegistry.get(NATIVE_MODULE_NAME) != null) {
            try {
                // eslint-disable-next-line @typescript-eslint/no-require-imports
                const loaded = require('@react-native-google-signin/google-signin') as
                    | GoogleModule
                    | undefined;
                // Metro hands back `undefined` (after reporting the error) if evaluation failed.
                googleModule = loaded ?? null;
            } catch {
                googleModule = null;
            }
        }
    }
    return googleModule;
}

/** False in builds without the Google native module (Expo Go, older APKs): hide the button. */
export function isGoogleSignInAvailable(): boolean {
    return loadGoogle() !== null;
}

function configure(google: GoogleModule) {
    if (configured) return;
    const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
    if (!webClientId) throw new GoogleAuthError('Google sign-in is not configured');

    // The Web client ID (not the Android one) is what makes Google issue an ID token whose
    // audience the backend can verify.
    google.GoogleSignin.configure({ webClientId });
    configured = true;
}

/**
 * Opens the Google account picker and resolves to the user's Google ID token, to be verified by
 * the backend. Resolves to `null` when the user cancels (or a sign-in is already running), which
 * isn't an error. Throws an `Error` with a user-facing message for real failures.
 */
export async function getGoogleIdToken(): Promise<string | null> {
    const google = loadGoogle();
    if (!google) {
        throw new Error('Google sign-in needs the development build of the app');
    }
    const { GoogleSignin, isErrorWithCode, isSuccessResponse, statusCodes } = google;

    try {
        configure(google);
        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

        const response = await GoogleSignin.signIn();
        if (!isSuccessResponse(response)) return null;

        const idToken = response.data.idToken;
        if (!idToken) throw new GoogleAuthError('Google did not return an ID token');
        return idToken;
    } catch (e) {
        if (e instanceof GoogleAuthError) throw e;

        if (isErrorWithCode(e)) {
            if (e.code === statusCodes.IN_PROGRESS || e.code === statusCodes.SIGN_IN_CANCELLED) {
                return null;
            }
            if (e.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
                throw new Error('Google Play Services is missing or out of date on this device');
            }
        }
        throw new Error('Google sign-in failed. Please try again.');
    }
}

/**
 * Forgets the Google account on this device so the account picker shows again next time.
 * Best effort: a failure here (or a build without Google) must never block signing out of the app.
 */
export async function signOutOfGoogle(): Promise<void> {
    try {
        await loadGoogle()?.GoogleSignin.signOut();
    } catch {
        // ignore
    }
}
