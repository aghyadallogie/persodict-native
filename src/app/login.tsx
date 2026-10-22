import { useAuth } from '@/lib/auth';
import { useTheme } from '@/lib/theme';
import { useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput
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
            <Text style={[styles.title, { color: colors.text }]}>Persodict</Text>

            <TextInput
                placeholder="Email"
                placeholderTextColor={colors.textMuted}
                value={email}
                onChangeText={setEmail}
                style={[styles.input, { borderColor: colors.border, color: colors.text }]}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                textContentType="emailAddress"
            />

            <TextInput
                placeholder="Password"
                placeholderTextColor={colors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                style={[styles.input, { borderColor: colors.border, color: colors.text }]}
                textContentType="password"
                onSubmitEditing={canSubmit ? handleLogin : undefined}
            />

            {error && (
                <Text style={styles.error} accessibilityRole="alert">
                    {error}
                </Text>
            )}

            <Pressable
                disabled={!canSubmit}
                onPress={handleLogin}
                style={[
                    styles.button,
                    { backgroundColor: colors.primary, opacity: canSubmit ? 1 : 0.5 },
                ]}
            >
                {submitting ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.buttonText}>Log In</Text>
                )}
            </Pressable>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', padding: 24 },
    title: { fontSize: 32, fontWeight: 'bold', textAlign: 'center', marginBottom: 32 },
    input: { borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 16 },
    error: { color: '#DC2626', marginBottom: 12, textAlign: 'center' },
    button: { padding: 16, borderRadius: 8, alignItems: 'center' },
    buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});