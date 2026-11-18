import { AuthScreen } from '@/components/auth/auth-screen';
import { Input } from '@/components/ui/input';
import { useAuthSubmit } from '@/features/auth/use-auth-submit';
import { useAuth } from '@/lib/auth';
import { router } from 'expo-router';
import { useState } from 'react';

const MIN_PASSWORD_LENGTH = 6;

export default function RegisterScreen() {
    const { signUp, signInWithGoogle } = useAuth();
    const { submitting, pending, error, setError, run } = useAuthSubmit('Sign up failed');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');

    const canSubmit =
        email.trim().length > 0 && password.length > 0 && confirm.length > 0 && !submitting;

    const handleRegister = () => {
        if (password.length < MIN_PASSWORD_LENGTH) {
            setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
            return;
        }
        if (password !== confirm) {
            setError('Passwords do not match');
            return;
        }

        void run(() => signUp(email, password, name));
    };

    const handleGoogle = () => {
        void run(() => signInWithGoogle(), 'google');
    };

    return (
        <AuthScreen
            title="Create account"
            submitLabel="Create Account"
            submitting={pending === 'form'}
            canSubmit={canSubmit}
            googleSubmitting={pending === 'google'}
            onGooglePress={handleGoogle}
            error={error}
            onSubmit={handleRegister}
            switchPrompt="Already have an account?"
            switchLabel="Log in"
            onSwitch={() => router.replace('/login')}
        >
            <Input
                placeholder="Name (optional)"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                textContentType="name"
            />

            <Input
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                textContentType="emailAddress"
            />

            <Input
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                textContentType="newPassword"
            />

            <Input
                placeholder="Confirm password"
                value={confirm}
                onChangeText={setConfirm}
                secureTextEntry
                textContentType="newPassword"
                onSubmitEditing={canSubmit ? handleRegister : undefined}
            />
        </AuthScreen>
    );
}
