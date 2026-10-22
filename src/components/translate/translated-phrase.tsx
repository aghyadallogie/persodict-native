import type { Phrase } from '@/features/history/types';
import { flagFor } from '@/lib/lang-flag';
import { useTheme } from '@/lib/theme';
import { StyleSheet, Text, View } from 'react-native';

export function TranslatedPhrase({ phrase }: { phrase: Phrase }) {
    const { colors } = useTheme();
    const entries = Object.entries(phrase.translations);

    return (
        <View
            style={[
                styles.card,
                { borderColor: colors.border, boxShadow: `0px 2px 8px ${colors.shadow}` },
            ]}
        >
            {entries.map(([lang, text], index) => (
                <View
                    key={lang}
                    style={[
                        styles.row,
                        index < entries.length - 1 && {
                            borderBottomWidth: 1,
                            borderStyle: 'dotted',
                            borderBottomColor: colors.border,
                        },
                    ]}
                >
                    <Text style={styles.flag}>{flagFor(lang)}</Text>
                    <Text style={[styles.text, { color: colors.text }]} numberOfLines={3}>
                        {text}
                    </Text>
                </View>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        borderWidth: 1,
        borderRadius: 10,
        paddingVertical: 4,
        paddingHorizontal: 12,
        marginTop: 20,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        paddingVertical: 10,
    },
    flag: { fontSize: 18 },
    text: { fontSize: 16, flex: 1, textAlign: 'right' },
});