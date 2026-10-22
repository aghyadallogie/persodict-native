import { useTheme } from '@/lib/theme';
import { Text, View } from 'react-native';

export function NoWords({ error }: { error: Error | null }) {
    const { colors } = useTheme();
    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
            <Text style={{ color: colors.text, fontSize: 18, fontWeight: '600', marginBottom: 8 }}>
                No phrases yet
            </Text>
            <Text style={{ color: colors.textMuted, textAlign: 'center' }}>
                {error
                    ? 'Something went wrong loading your history.'
                    : 'Your translation history will appear here.'}
            </Text>
        </View>
    );
}