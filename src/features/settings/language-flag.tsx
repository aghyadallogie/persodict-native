import { flagFor } from '@/lib/lang-flag';
import { ThemeColors, useThemedStyles } from '@/lib/use-themed-styles';
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
    const { styles } = useThemedStyles(createStyles);

    return (
        <Pressable
            onPress={saving ? undefined : onToggle}
            disabled={saving}
            style={({ pressed }) => [
                styles.cell,
                picked && styles.cellPicked,
                { opacity: saving ? 0.6 : pressed ? 0.85 : picked ? 1 : 0.75 },
            ]}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: picked, disabled: saving }}
        >
            <Text style={styles.flag}>{flagFor(code)}</Text>
            {picked && (
                <View style={styles.badge}>
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

const createStyles = (colors: ThemeColors) =>
    StyleSheet.create({
        cell: {
            width: 76,
            height: 60,
            borderWidth: 2,
            borderColor: 'transparent',
            borderRadius: 12,
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
        },
        cellPicked: { borderColor: colors.primary },
        flag: { fontSize: 38 },
        badge: {
            position: 'absolute',
            top: -6,
            right: -6,
            minWidth: 20,
            height: 20,
            borderRadius: 10,
            backgroundColor: colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 4,
        },
        badgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
    });
