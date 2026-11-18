import RegisterScreen from '@/app/register';
import { useAuth } from '@/lib/auth';
import { fireEvent, render, screen } from '@testing-library/react-native';

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

const signUp = jest.fn();
const signInWithGoogle = jest.fn();

async function fill(placeholder: string, value: string) {
    await fireEvent.changeText(screen.getByPlaceholderText(placeholder), value);
}

const submitButton = () => screen.getByRole('button', { name: 'Create Account' });

beforeEach(() => {
    signUp.mockReset();
    signUp.mockResolvedValue(undefined);
    signInWithGoogle.mockReset();
    signInWithGoogle.mockResolvedValue(undefined);
    (useAuth as jest.Mock).mockReturnValue({ signUp, signInWithGoogle });
});

describe('RegisterScreen', () => {
    it('does not submit until email, password and confirmation are filled in', async () => {
        await render(<RegisterScreen />);

        await fireEvent.press(submitButton());
        expect(signUp).not.toHaveBeenCalled();

        await fill('Email', 'a@b.co');
        await fill('Password', 'secret1');
        await fireEvent.press(submitButton());
        expect(signUp).not.toHaveBeenCalled();
    });

    it('rejects a password shorter than 6 characters without calling the API', async () => {
        await render(<RegisterScreen />);
        await fill('Email', 'a@b.co');
        await fill('Password', '12345');
        await fill('Confirm password', '12345');

        await fireEvent.press(submitButton());

        expect(screen.getByText('Password must be at least 6 characters')).toBeTruthy();
        expect(signUp).not.toHaveBeenCalled();
    });

    it('rejects mismatched passwords without calling the API', async () => {
        await render(<RegisterScreen />);
        await fill('Email', 'a@b.co');
        await fill('Password', 'secret1');
        await fill('Confirm password', 'secret2');

        await fireEvent.press(submitButton());

        expect(screen.getByText('Passwords do not match')).toBeTruthy();
        expect(signUp).not.toHaveBeenCalled();
    });

    it('calls signUp with the entered details when the form is valid', async () => {
        await render(<RegisterScreen />);
        await fill('Name (optional)', 'Ada');
        await fill('Email', 'a@b.co');
        await fill('Password', 'secret1');
        await fill('Confirm password', 'secret1');

        await fireEvent.press(submitButton());

        expect(signUp).toHaveBeenCalledWith('a@b.co', 'secret1', 'Ada');
    });

    it("shows the server's error message when sign up fails", async () => {
        signUp.mockRejectedValue(new Error('An account with this email already exists'));
        await render(<RegisterScreen />);
        await fill('Email', 'a@b.co');
        await fill('Password', 'secret1');
        await fill('Confirm password', 'secret1');

        await fireEvent.press(submitButton());

        expect(await screen.findByText('An account with this email already exists')).toBeTruthy();
    });

    it('clears an earlier validation error once the form is valid and resubmitted', async () => {
        await render(<RegisterScreen />);
        await fill('Email', 'a@b.co');
        await fill('Password', 'secret1');
        await fill('Confirm password', 'nope');
        await fireEvent.press(submitButton());
        expect(screen.getByText('Passwords do not match')).toBeTruthy();

        await fill('Confirm password', 'secret1');
        await fireEvent.press(submitButton());

        expect(screen.queryByText('Passwords do not match')).toBeNull();
        expect(signUp).toHaveBeenCalledTimes(1);
    });

    it('offers Google sign-up, which skips the form validation', async () => {
        await render(<RegisterScreen />);
        await fill('Password', '123'); // would fail the length check if the form were submitted

        await fireEvent.press(screen.getByRole('button', { name: 'Continue with Google' }));

        expect(signInWithGoogle).toHaveBeenCalledTimes(1);
        expect(signUp).not.toHaveBeenCalled();
        expect(screen.queryByText('Password must be at least 6 characters')).toBeNull();
    });

    it('shows the error when Google sign-up fails', async () => {
        signInWithGoogle.mockRejectedValue(new Error('Email not verified'));
        await render(<RegisterScreen />);

        await fireEvent.press(screen.getByRole('button', { name: 'Continue with Google' }));

        expect(await screen.findByText('Email not verified')).toBeTruthy();
    });
});
