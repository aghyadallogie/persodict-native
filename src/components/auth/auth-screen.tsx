import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/logo';
import { ThemeColors, useThemedStyles } from '@/lib/use-themed-styles';
import { ReactNode } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

type Props = {
    title: string;
    /** Button text, also used as its accessibility label. */
    submitLabel: string;
    submitting: boolean;
    canSubmit: boolean;
    error: string | null;
    onSubmit: () => void;
    /** e.g. "New here?" */
    switchPrompt: string;
    /** e.g. "Create an account" */
    switchLabel: string;
    onSwitch: () => void;
    /** The form fields. */
    children: ReactNode;
};

/** Shared chrome for the login and register screens: logo, title, fields, error, submit, switch link. */
export function AuthScreen({
    title,
    submitLabel,
    submitting,
    canSubmit,
    error,
    onSubmit,
    switchPrompt,
    switchLabel,
    onSwitch,
    children,
}: Props) {
    const { styles, colors } = useThemedStyles(createStyles);

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.flex}
        >
            <ScrollView
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.container}
            >
                <View style={styles.logo}>
                    <Logo size={96} />
                </View>

                <Text style={styles.title}>{title}</Text>

                <View style={styles.fields}>{children}</View>

                {error && (
                    <Text style={styles.error} accessibilityRole="alert">
                        {error}
                    </Text>
                )}

                <Button
                    disabled={!canSubmit}
                    onPress={onSubmit}
                    style={styles.button}
                    accessibilityLabel={submitLabel}
                >
                    {submitting ? <ActivityIndicator color={colors.primary} /> : submitLabel}
                </Button>

                <Text style={styles.switch}>
                    {switchPrompt}{' '}
                    <Text style={styles.switchLink} onPress={onSwitch} accessibilityRole="link">
                        {switchLabel}
                    </Text>
                </Text>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const createStyles = (colors: ThemeColors) =>
    StyleSheet.create({
        flex: { flex: 1, backgroundColor: colors.background },
        container: { flexGrow: 1, justifyContent: 'center', padding: 24 },
        logo: { alignItems: 'center', marginBottom: 16 },
        title: {
            color: colors.text,
            fontSize: 32,
            fontWeight: 'bold',
            textAlign: 'center',
            marginBottom: 32,
        },
        fields: { gap: 20, marginBottom: 20 },
        error: { color: colors.danger, marginBottom: 12, textAlign: 'center' },
        button: { width: '100%', marginTop: 26, marginBottom: 12 },
        switch: { color: colors.textMuted, textAlign: 'center', marginTop: 24, fontSize: 15 },
        switchLink: { color: colors.primary },
    });
