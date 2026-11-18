// Builds without the Google native module (Expo Go, or an APK made before the library was added).
//
// The important detail: on a device, Metro does NOT throw when a required module fails to evaluate;
// it reports a fatal error (red screen) and returns `undefined`, so `try { require(lib) } catch {}`
// cannot detect a missing native module. The helper must therefore ask the (non-throwing)
// TurboModuleRegistry first and never require the library when the native module is absent.
// Jest, unlike Metro, does throw from require, so these tests assert that the library is never
// even evaluated in that case.
const libraryEvaluated = jest.fn();

type Helper = typeof import('@/lib/google-auth');

/**
 * Loads a fresh copy of the helper in a world where the native module is (or isn't) registered
 * and the Google library behaves as `evaluate` says. Module registries are reset each time so
 * that nothing (the helper's cache, the mocked library, the registry mock) leaks between tests.
 */
function loadHelper({
    nativeModule,
    evaluate = () => ({ GoogleSignin: {} }),
}: {
    nativeModule: boolean;
    evaluate?: () => unknown;
}) {
    jest.resetModules();

    jest.doMock('@react-native-google-signin/google-signin', () => {
        libraryEvaluated();
        return evaluate();
    });

    const { TurboModuleRegistry } = jest.requireActual<typeof import('react-native')>('react-native');
    const nativeGet = TurboModuleRegistry.get as jest.Mock;
    nativeGet.mockImplementation((name: string) =>
        name === 'RNGoogleSignin' && nativeModule ? {} : null
    );

    return { helper: jest.requireActual<Helper>('@/lib/google-auth'), nativeGet };
}

const throwsLikeExpoGo = () => {
    throw new Error("TurboModuleRegistry.getEnforcing(...): 'RNGoogleSignin' could not be found.");
};

beforeEach(() => {
    libraryEvaluated.mockClear();
});

describe('google-auth when the native module is missing (Expo Go, older APKs)', () => {
    it('reports Google sign-in as unavailable, without ever loading the library', () => {
        const { helper } = loadHelper({ nativeModule: false, evaluate: throwsLikeExpoGo });

        expect(helper.isGoogleSignInAvailable()).toBe(false);
        // This is the regression: evaluating the library is what triggered Metro's red screen.
        expect(libraryEvaluated).not.toHaveBeenCalled();
    });

    it('does not load the library when the helper itself is imported', () => {
        loadHelper({ nativeModule: false, evaluate: throwsLikeExpoGo });

        expect(libraryEvaluated).not.toHaveBeenCalled();
    });

    it('explains what is needed if sign-in is attempted anyway', async () => {
        const { helper } = loadHelper({ nativeModule: false, evaluate: throwsLikeExpoGo });

        await expect(helper.getGoogleIdToken()).rejects.toThrow(
            'Google sign-in needs the development build of the app'
        );
        expect(libraryEvaluated).not.toHaveBeenCalled();
    });

    it('lets the user sign out of the app regardless', async () => {
        const { helper } = loadHelper({ nativeModule: false, evaluate: throwsLikeExpoGo });

        await expect(helper.signOutOfGoogle()).resolves.toBeUndefined();
        expect(libraryEvaluated).not.toHaveBeenCalled();
    });

    it('asks the registry for the right module name', () => {
        const { helper, nativeGet } = loadHelper({ nativeModule: false });

        helper.isGoogleSignInAvailable();

        expect(nativeGet).toHaveBeenCalledWith('RNGoogleSignin');
    });
});

describe('google-auth when the native module exists but the library fails to load', () => {
    it('treats a throwing library as unavailable', () => {
        const { helper } = loadHelper({
            nativeModule: true,
            evaluate: () => {
                throw new Error('broken install');
            },
        });

        expect(helper.isGoogleSignInAvailable()).toBe(false);
    });

    it('treats `undefined` (what Metro returns after reporting a failed load) as unavailable', async () => {
        const { helper } = loadHelper({ nativeModule: true, evaluate: () => undefined });

        expect(helper.isGoogleSignInAvailable()).toBe(false);
        await expect(helper.getGoogleIdToken()).rejects.toThrow(
            'Google sign-in needs the development build of the app'
        );
    });

    it('only tries once, however often it is asked', async () => {
        const { helper } = loadHelper({
            nativeModule: true,
            evaluate: () => {
                throw new Error('broken install');
            },
        });

        helper.isGoogleSignInAvailable();
        helper.isGoogleSignInAvailable();
        await helper.getGoogleIdToken().catch(() => {});

        expect(libraryEvaluated).toHaveBeenCalledTimes(1);
    });
});

describe('google-auth when the native module exists', () => {
    it('loads the library lazily, only once something asks for it', () => {
        const { helper } = loadHelper({ nativeModule: true });
        expect(libraryEvaluated).not.toHaveBeenCalled();

        expect(helper.isGoogleSignInAvailable()).toBe(true);
        expect(libraryEvaluated).toHaveBeenCalledTimes(1);
    });
});
