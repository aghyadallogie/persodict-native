// Reanimated and Worklets need native modules that don't exist under Jest; use their built-in
// mocks so tests can render animated components (animations resolve instantly).
jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));

// By default behave like a build that includes the Google native module, so that
// `TurboModuleRegistry.get('RNGoogleSignin')` finds it. Tests of "Expo Go" make `get` return null.
jest.mock('react-native/Libraries/TurboModule/TurboModuleRegistry', () => {
    const actual = jest.requireActual('react-native/Libraries/TurboModule/TurboModuleRegistry');
    return {
        ...actual,
        get: jest.fn((name) => (name === 'RNGoogleSignin' ? {} : actual.get(name))),
    };
});

// Google Sign-In is a native module (and throws on import without it), so replace its JS API.
// Tests that care about the behavior override these with their own mockResolvedValue etc.
jest.mock('@react-native-google-signin/google-signin', () => ({
    GoogleSignin: {
        configure: jest.fn(),
        hasPlayServices: jest.fn().mockResolvedValue(true),
        signIn: jest.fn().mockResolvedValue({ type: 'cancelled', data: null }),
        signOut: jest.fn().mockResolvedValue(null),
    },
    isSuccessResponse: (response) => response?.type === 'success',
    isErrorWithCode: (error) =>
        typeof error === 'object' && error !== null && 'code' in error,
    statusCodes: {
        IN_PROGRESS: 'IN_PROGRESS',
        PLAY_SERVICES_NOT_AVAILABLE: 'PLAY_SERVICES_NOT_AVAILABLE',
        SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED',
    },
}));
