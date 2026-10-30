import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Logo } from '@/components/ui/logo';
import { useAuth } from '@/lib/auth';
import { ThemeColors, useThemedStyles } from '@/lib/use-themed-styles';
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
    const { styles, colors } = useThemedStyles(createStyles);
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
            style={styles.container}
        >
            <View style={styles.logo}>
                <Logo size={96} />
            </View>

            <Text style={styles.title}>Persodict</Text>

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

            <Text style={styles.switch}>
                New here?{' '}
                <Text
                    style={styles.switchLink}
                    onPress={() => router.replace('/register')}
                    accessibilityRole="link"
                >
                    Create an account
                </Text>
            </Text>
        </KeyboardAvoidingView>
    );
}

const createStyles = (colors: ThemeColors) =>
    StyleSheet.create({
        container: {
            flex: 1,
            justifyContent: 'center',
            padding: 24,
            backgroundColor: colors.background,
        },
        logo: { alignItems: 'center', marginBottom: 16 },
        title: {
            color: colors.text,
            fontSize: 32,
            fontWeight: 'bold',
            textAlign: 'center',
            marginBottom: 32,
        },
        input: { marginBottom: 20 },
        error: { color: '#DC2626', marginBottom: 12, textAlign: 'center' },
        button: { width: '100%', marginTop: 26, marginBottom: 12 },
        switch: { color: colors.textMuted, textAlign: 'center', marginTop: 24, fontSize: 15 },
        switchLink: { color: colors.primary },
    });
