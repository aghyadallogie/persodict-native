import { AuthScreen } from '@/components/auth/auth-screen';
import { Input } from '@/components/ui/input';
import { useAuthSubmit } from '@/features/auth/use-auth-submit';
import { useAuth } from '@/lib/auth';
import { router } from 'expo-router';
import { useState } from 'react';

export default function LoginScreen() {
    const { signIn } = useAuth();
    const { submitting, error, run } = useAuthSubmit('Login failed');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const canSubmit = email.trim().length > 0 && password.length > 0 && !submitting;

    const handleLogin = () => run(() => signIn(email, password));

    return (
        <AuthScreen
            title="Persodict"
            submitLabel="Log In"
            submitting={submitting}
            canSubmit={canSubmit}
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
