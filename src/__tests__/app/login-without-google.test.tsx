import LoginScreen from '@/app/login';
import RegisterScreen from '@/app/register';
import { useAuth } from '@/lib/auth';
import { fireEvent, render, screen } from '@testing-library/react-native';

// Expo Go / older builds: the Google native module is missing, so the helper says "unavailable".
jest.mock('@/lib/google-auth', () => ({
    isGoogleSignInAvailable: () => false,
    getGoogleIdToken: jest.fn(),
    signOutOfGoogle: jest.fn(),
}));
jest.mock('@/lib/auth', () => ({ useAuth: jest.fn() }));
jest.mock('@/lib/theme', () => ({
    useTheme: () => ({
        colors: jest.requireActual('@/constants/theme').Colors.light,
        isDark: false,
        mode: null,
        setMode: jest.fn(),
    }),
}));
jest.mock('@/components/ui/logo', () => ({ Logo: () => null }));
jest.mock('expo-router', () => ({ router: { replace: jest.fn() } }));

const signIn = jest.fn();
const signUp = jest.fn();
const signInWithGoogle = jest.fn();

beforeEach(() => {
    signIn.mockReset().mockResolvedValue(undefined);
    signUp.mockReset().mockResolvedValue(undefined);
    signInWithGoogle.mockReset();
    (useAuth as jest.Mock).mockReturnValue({ signIn, signUp, signInWithGoogle });
});

describe('auth screens without the Google native module', () => {
    it('login hides the Google button and the "or" divider', async () => {
        await render(<LoginScreen />);

        expect(screen.queryByRole('button', { name: 'Continue with Google' })).toBeNull();
        expect(screen.queryByText('or')).toBeNull();
    });

    it('register hides the Google button too', async () => {
        await render(<RegisterScreen />);

        expect(screen.queryByRole('button', { name: 'Continue with Google' })).toBeNull();
    });

    it('email login still works', async () => {
        await render(<LoginScreen />);
        await fireEvent.changeText(screen.getByPlaceholderText('Email'), 'a@b.co');
        await fireEvent.changeText(screen.getByPlaceholderText('Password'), 'secret1');

        await fireEvent.press(screen.getByRole('button', { name: 'Log In' }));

        expect(signIn).toHaveBeenCalledWith('a@b.co', 'secret1');
        expect(signInWithGoogle).not.toHaveBeenCalled();
    });
});
