import type { Phrase } from '@/features/history/types';
import { useDeletePhrase } from '@/features/history/use-delete-phrase';
import { flagFor } from '@/lib/lang-flag';
import { useTheme } from '@/lib/theme';
import { useState } from 'react';
import {
    Alert,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import Animated, { FadeInDown, FadeOutLeft } from 'react-native-reanimated';

const EXIT_MS = 250;

type Props = {
    phrase: Phrase;
    waitForExit?: boolean;
};

export function PhraseView({ phrase, waitForExit = false }: Props) {
    const { colors } = useTheme();
    const { handleDeletePhrase } = useDeletePhrase();
    const [revealed, setRevealed] = useState(false);

    const entries = Object.entries(phrase.translations);

    const onDelete = () => {
        handleDeletePhrase(phrase.id).catch(() => {
            Alert.alert('Delete failed', 'Please try again.');
        });
    };

    return (
        <Animated.View
            entering={FadeInDown.delay(waitForExit ? EXIT_MS : 0).duration(300)}
            exiting={FadeOutLeft.duration(EXIT_MS)}
        >
            <Pressable
                onLongPress={() => setRevealed((v) => !v)}
                delayLongPress={300}
                style={[
                    styles.card,
                    { borderColor: colors.border },
                    { boxShadow: `0px 2px 8px ${colors.shadow}` },
                ]}
            >
                {/* Delete control: hidden until long-press, like the hover reveal on web */}
                {revealed && (
                    <Pressable
                        onPress={onDelete}
                        hitSlop={12}
                        style={styles.delete}
                        accessibilityLabel="Delete phrase"
                    >
                        <Text style={styles.deleteText}>✕</Text>
                    </Pressable>
                )}

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
                        <Text style={[styles.text, { color: colors.text }]} numberOfLines={2}>
                            {text}
                        </Text>
                    </View>
                ))}
            </Pressable>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    card: {
        borderWidth: 1,
        borderRadius: 10,
        paddingVertical: 4,
        paddingHorizontal: 12,
        position: 'relative',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 6,
    },
    flag: { fontSize: 20 },
    text: { fontSize: 16, flex: 1, textAlign: 'right', paddingRight: 4 },
    delete: {
        position: 'absolute',
        top: 1,
        right: 4,
        padding: 1,
        zIndex: 1,
    },
    deleteText: {
        color: '#DC262675',
        fontSize: 10,
        fontWeight: '600',
    },
});