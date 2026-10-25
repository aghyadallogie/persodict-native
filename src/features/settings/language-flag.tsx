import { flagFor } from '@/lib/lang-flag';
import { useTheme } from '@/lib/theme';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

export function LanguageFlag({
    code,
    picked,
    saving,
    onToggle,
}: {
    code: string;
    picked: boolean;
    saving: boolean;
    onToggle: () => void;
}) {
    const { colors } = useTheme();

    return (
        <Pressable
            onPress={saving ? undefined : onToggle}
            disabled={saving}
            style={({ pressed }) => [
                styles.cell,
                {
                    borderColor: picked ? colors.primary : 'transparent',
                    opacity: saving ? 0.6 : pressed ? 0.85 : picked ? 1 : 0.75,
                },
            ]}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: picked, disabled: saving }}
        >
            <Text style={styles.flag}>{flagFor(code)}</Text>
            {picked && (
                <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                    {saving ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <Text style={styles.badgeText}>✓</Text>
                    )}
                </View>
            )}
        </Pressable>
    );
}

const styles = StyleSheet.create({
    cell: {
        width: 88,
        height: 76,
        borderWidth: 2,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    flag: { fontSize: 38 },
    code: { fontSize: 11, fontWeight: '600', marginTop: 4 },
    badge: {
        position: 'absolute',
        top: -6,
        right: -6,
        minWidth: 20,
        height: 20,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 4,
    },
    badgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
});