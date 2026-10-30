import { ThemeColors, useThemedStyles } from '@/lib/use-themed-styles';
import { StyleSheet, Text, View } from 'react-native';

export function NoWords({ error }: { error: Error | null }) {
    const { styles } = useThemedStyles(createStyles);

    return (
        <View style={styles.container}>
            <Text style={styles.title}>No translated phrases yet!</Text>
            <Text style={styles.message}>
                {error
                    ? 'Something went wrong loading your history.'
                    : 'Your translation history will appear here.'}
            </Text>
        </View>
    );
}

const createStyles = (colors: ThemeColors) =>
    StyleSheet.create({
        container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
        title: { color: colors.text, fontSize: 18, fontWeight: '600', marginBottom: 8 },
        message: { color: colors.textMuted, textAlign: 'center' },
    });
