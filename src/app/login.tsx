import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Logo } from '@/components/ui/logo';
import { useAuth } from '@/lib/auth';
import { useTheme } from '@/lib/theme';
import { router } from 'expo-router';
import { useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    View,
} from 'react-native';

export default function LoginScreen() {
    const { signIn } = useAuth();
    const { colors } = useTheme();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async () => {
        setError(null);
        setSubmitting(true);
        try {
            await signIn(email.trim(), password);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Login failed');
        } finally {
            setSubmitting(false);
        }
    };

    const canSubmit = email.trim().length > 0 && password.length > 0 && !submitting;

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={[styles.container, { backgroundColor: colors.background }]}
        >
            <View style={styles.logo}>
                <Logo size={96} />
            </View>

            <Text style={[styles.title, { color: colors.text }]}>Persodict</Text>

            <Input
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                style={styles.input}
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
                style={styles.input}
                textContentType="password"
                onSubmitEditing={canSubmit ? handleLogin : undefined}
            />

            {error && (
                <Text style={styles.error} accessibilityRole="alert">
                    {error}
                </Text>
            )}

            <Button
                disabled={!canSubmit}
                onPress={handleLogin}
                style={styles.button}
                accessibilityLabel="Log in"
            >
                {submitting ? <ActivityIndicator color={colors.primary} /> : 'Log In'}
            </Button>

            <Text style={[styles.switch, { color: colors.textMuted }]}>
                New here?{' '}
                <Text
                    style={{ color: colors.primary, fontWeight: '600' }}
                    onPress={() => router.replace('/register')}
                    accessibilityRole="link"
                >
                    Create an account
                </Text>
            </Text>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', padding: 24 },
    logo: { alignItems: 'center', marginBottom: 16 },
    title: { fontSize: 32, fontWeight: 'bold', textAlign: 'center', marginBottom: 32 },
    input: { marginBottom: 16 },
    error: { color: '#DC2626', marginBottom: 12, textAlign: 'center' },
    button: { width: '100%', marginTop: 26 },
    switch: { textAlign: 'center', marginTop: 24, fontSize: 15 },
});