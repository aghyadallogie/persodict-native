import { useAuthSubmit } from '@/features/auth/use-auth-submit';
import { act, renderHook } from '@testing-library/react-native';

describe('useAuthSubmit', () => {
    it('starts idle', async () => {
        const { result } = await renderHook(() => useAuthSubmit('Login failed'));

        expect(result.current.submitting).toBe(false);
        expect(result.current.error).toBeNull();
    });

    it('is submitting while the action runs, then idle with no error on success', async () => {
        const { result } = await renderHook(() => useAuthSubmit('Login failed'));
        let finish!: () => void;
        const action = jest.fn(() => new Promise<void>((resolve) => (finish = resolve)));

        let running!: Promise<void>;
        await act(async () => {
            running = result.current.run(action);
        });
        expect(result.current.submitting).toBe(true);

        await act(async () => {
            finish();
            await running;
        });
        expect(result.current.submitting).toBe(false);
        expect(result.current.error).toBeNull();
    });

    it("shows the thrown error's message and stops submitting", async () => {
        const { result } = await renderHook(() => useAuthSubmit('Login failed'));

        await act(() =>
            result.current.run(async () => {
                throw new Error('Invalid email or password');
            })
        );

        expect(result.current.error).toBe('Invalid email or password');
        expect(result.current.submitting).toBe(false);
    });

    it('falls back to the default message when a non-Error is thrown', async () => {
        const { result } = await renderHook(() => useAuthSubmit('Sign up failed'));

        await act(() =>
            result.current.run(async () => {
                throw 'boom';
            })
        );

        expect(result.current.error).toBe('Sign up failed');
    });

    it('clears the previous error when the next attempt starts', async () => {
        const { result } = await renderHook(() => useAuthSubmit('Login failed'));
        await act(() =>
            result.current.run(async () => {
                throw new Error('first failure');
            })
        );
        expect(result.current.error).toBe('first failure');

        await act(() => result.current.run(async () => {}));

        expect(result.current.error).toBeNull();
    });

    it('lets a form set its own validation error', async () => {
        const { result } = await renderHook(() => useAuthSubmit('Sign up failed'));

        await act(async () => result.current.setError('Passwords do not match'));

        expect(result.current.error).toBe('Passwords do not match');
    });

    it('reports which kind of action is running, defaulting to the form', async () => {
        const { result } = await renderHook(() => useAuthSubmit('Login failed'));
        let finish!: () => void;
        const pendingAction = () => new Promise<void>((resolve) => (finish = resolve));

        let running!: Promise<void>;
        await act(async () => {
            running = result.current.run(pendingAction);
        });
        expect(result.current.pending).toBe('form');
        expect(result.current.submitting).toBe(true);
        await act(async () => {
            finish();
            await running;
        });
        expect(result.current.pending).toBeNull();

        await act(async () => {
            running = result.current.run(pendingAction, 'google');
        });
        expect(result.current.pending).toBe('google');
        expect(result.current.submitting).toBe(true);
        await act(async () => {
            finish();
            await running;
        });
        expect(result.current.submitting).toBe(false);
    });

    it('clears the error from a failed Google attempt when the form is submitted next', async () => {
        const { result } = await renderHook(() => useAuthSubmit('Login failed'));
        await act(() =>
            result.current.run(async () => {
                throw new Error('Google sign-in failed');
            }, 'google')
        );
        expect(result.current.error).toBe('Google sign-in failed');

        await act(() => result.current.run(async () => {}));

        expect(result.current.error).toBeNull();
    });
});
