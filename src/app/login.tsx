import { AuthScreen } from '@/components/auth/auth-screen';
import { Input } from '@/components/ui/input';
import { useAuthSubmit } from '@/features/auth/use-auth-submit';
import { useAuth } from '@/lib/auth';
import { router } from 'expo-router';
import { useState } from 'react';

export default function LoginScreen() {
    const { signIn, signInWithGoogle } = useAuth();
    const { submitting, pending, error, run } = useAuthSubmit('Login failed');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const canSubmit = email.trim().length > 0 && password.length > 0 && !submitting;

    // Event handlers return nothing: React Native ignores a returned promise, and `run` already
    // reports its own errors through `error`.
    const handleLogin = () => {
        void run(() => signIn(email, password));
    };
    const handleGoogle = () => {
        void run(() => signInWithGoogle(), 'google');
    };

    return (
        <AuthScreen
            title="Persodict"
            submitLabel="Log In"
            submitting={pending === 'form'}
            canSubmit={canSubmit}
            googleSubmitting={pending === 'google'}
            onGooglePress={handleGoogle}
            error={error}
            onSubmit={handleLogin}
            switchPrompt="New here?"
            switchLabel="Create an account"
            onSwitch={() => router.replace('/register')}
        >
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
                textContentType="password"
                onSubmitEditing={canSubmit ? handleLogin : undefined}
            />
        </AuthScreen>
    );
}
