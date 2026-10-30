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
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

const MIN_PASSWORD_LENGTH = 6;

export default function RegisterScreen() {
    const { signUp } = useAuth();
    const { colors } = useTheme();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const canSubmit =
        email.trim().length > 0 && password.length > 0 && confirm.length > 0 && !submitting;

    const handleRegister = async () => {
        if (password.length < MIN_PASSWORD_LENGTH) {
            setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
            return;
        }
        if (password !== confirm) {
            setError('Passwords do not match');
            return;
        }

        setError(null);
        setSubmitting(true);
        try {
            await signUp(email, password, name);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Sign up failed');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={[styles.flex, { backgroundColor: colors.background }]}
        >
            <ScrollView
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.container}
            >
                <View style={styles.logo}>
                    <Logo size={96} />
                </View>

                <Text style={[styles.title, { color: colors.text }]}>Create account</Text>

                <Input
                    placeholder="Name (optional)"
                    value={name}
                    onChangeText={setName}
                    style={styles.input}
                    autoCapitalize="words"
                    textContentType="name"
                />

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
                    textContentType="newPassword"
                />

                <Input
                    placeholder="Confirm password"
                    value={confirm}
                    onChangeText={setConfirm}
                    secureTextEntry
                    style={styles.input}
                    textContentType="newPassword"
                    onSubmitEditing={canSubmit ? handleRegister : undefined}
                />

                {error && (
                    <Text style={styles.error} accessibilityRole="alert">
                        {error}
                    </Text>
                )}

                <Button
                    disabled={!canSubmit}
                    onPress={handleRegister}
                    style={styles.button}
                    accessibilityLabel="Create account"
                >
                    {submitting ? (
                        <ActivityIndicator color={colors.primary} />
                    ) : (
                        'Create Account'
                    )}
                </Button>

                <Text style={[styles.switch, { color: colors.textMuted }]}>
                    Already have an account?{' '}
                    <Text
                        style={{ color: colors.primary, fontWeight: '600' }}
                        onPress={() => router.replace('/login')}
                        accessibilityRole="link"
                    >
                        Log in
                    </Text>
                </Text>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    flex: { flex: 1 },
    container: { flexGrow: 1, justifyContent: 'center', padding: 24 },
    logo: { alignItems: 'center', marginBottom: 16 },
    title: { fontSize: 32, fontWeight: 'bold', textAlign: 'center', marginBottom: 32 },
    input: { marginBottom: 16 },
    error: { color: '#DC2626', marginBottom: 12, textAlign: 'center' },
    button: { width: '100%', marginTop: 26 },
    switch: { textAlign: 'center', marginTop: 24, fontSize: 15 },
});
