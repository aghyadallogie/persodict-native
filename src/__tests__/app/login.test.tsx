import LoginScreen from '@/app/login';
import { useAuth } from '@/lib/auth';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

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
const signInWithGoogle = jest.fn();

const loginButton = () => screen.getByRole('button', { name: 'Log In' });
const googleButton = () => screen.getByRole('button', { name: 'Continue with Google' });

async function fillCredentials() {
    await fireEvent.changeText(screen.getByPlaceholderText('Email'), 'a@b.co');
    await fireEvent.changeText(screen.getByPlaceholderText('Password'), 'secret1');
}

beforeEach(() => {
    signIn.mockReset().mockResolvedValue(undefined);
    signInWithGoogle.mockReset().mockResolvedValue(undefined);
    (useAuth as jest.Mock).mockReturnValue({ signIn, signInWithGoogle });
});

describe('LoginScreen', () => {
    it('logs in with the entered email and password', async () => {
        await render(<LoginScreen />);
        await fillCredentials();

        await fireEvent.press(loginButton());

        expect(signIn).toHaveBeenCalledWith('a@b.co', 'secret1');
        expect(signInWithGoogle).not.toHaveBeenCalled();
    });

    it('offers Google sign-in, which works without filling in the form', async () => {
        await render(<LoginScreen />);

        await fireEvent.press(googleButton());

        expect(signInWithGoogle).toHaveBeenCalledTimes(1);
        expect(signIn).not.toHaveBeenCalled();
    });

    it('shows the error when Google sign-in fails', async () => {
        signInWithGoogle.mockRejectedValue(new Error('Google sign-in was rejected. Please try again.'));
        await render(<LoginScreen />);

        await fireEvent.press(googleButton());

        expect(
            await screen.findByText('Google sign-in was rejected. Please try again.')
        ).toBeTruthy();
    });

    it('clears the Google error when the user tries again', async () => {
        signInWithGoogle.mockRejectedValueOnce(new Error('Google sign-in failed. Try again later'));
        await render(<LoginScreen />);
        await fireEvent.press(googleButton());
        expect(await screen.findByText('Google sign-in failed. Try again later')).toBeTruthy();

        await fireEvent.press(googleButton());

        expect(screen.queryByText('Google sign-in failed. Try again later')).toBeNull();
        expect(signInWithGoogle).toHaveBeenCalledTimes(2);
    });

    it('blocks the form and a second Google tap while Google sign-in is running', async () => {
        let finish!: () => void;
        signInWithGoogle.mockReturnValue(new Promise<void>((resolve) => (finish = resolve)));
        await render(<LoginScreen />);
        await fillCredentials();

        await fireEvent.press(googleButton());
        await fireEvent.press(googleButton());
        await fireEvent.press(loginButton());

        expect(signInWithGoogle).toHaveBeenCalledTimes(1);
        expect(signIn).not.toHaveBeenCalled();

        await act(async () => finish());
    });

    it('blocks Google sign-in while the form is submitting', async () => {
        let finish!: () => void;
        signIn.mockReturnValue(new Promise<void>((resolve) => (finish = resolve)));
        await render(<LoginScreen />);
        await fillCredentials();

        await fireEvent.press(loginButton());
        await fireEvent.press(googleButton());

        expect(signIn).toHaveBeenCalledTimes(1);
        expect(signInWithGoogle).not.toHaveBeenCalled();

        await act(async () => finish());
    });

    describe('button look while a request is running', () => {
        const flat = (el: { props: { style?: unknown } }) =>
            StyleSheet.flatten(el.props.style as never) as {
                boxShadow?: string;
                opacity?: number;
            };

        it('keeps Log In pushed in (not dimmed) until the login finishes, then pops it back up', async () => {
            let finish!: () => void;
            signIn.mockReturnValue(new Promise<void>((resolve) => (finish = resolve)));
            await render(<LoginScreen />);
            await fillCredentials();
            expect(flat(loginButton()).boxShadow).not.toMatch(/inset/);

            await fireEvent.press(loginButton());

            expect(flat(loginButton()).boxShadow).toMatch(/^inset /);
            expect(flat(loginButton()).opacity).toBeUndefined();

            await act(async () => finish());

            expect(flat(loginButton()).boxShadow).not.toMatch(/inset/);
        });

        it('keeps the Google button pushed in (not dimmed) until Google sign-in finishes', async () => {
            let finish!: () => void;
            signInWithGoogle.mockReturnValue(new Promise<void>((resolve) => (finish = resolve)));
            await render(<LoginScreen />);

            await fireEvent.press(googleButton());

            expect(flat(googleButton()).boxShadow).toMatch(/^inset /);
            expect(flat(googleButton()).opacity).toBeUndefined();
            // The other button is simply unavailable meanwhile: dimmed, not pushed in.
            expect(flat(loginButton()).boxShadow).not.toMatch(/inset/);
            expect(flat(loginButton()).opacity).toBe(0.5);

            await act(async () => finish());

            expect(flat(googleButton()).boxShadow).not.toMatch(/inset/);
        });
    });
});
