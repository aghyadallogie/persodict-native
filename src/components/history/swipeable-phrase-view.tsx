import type { Phrase } from '@/features/history/types';
import { useDeletePhrase } from '@/features/history/use-delete-phrase';
import { flagFor } from '@/lib/lang-flag';
import { useTheme } from '@/lib/theme';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    Extrapolation,
    interpolate,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from 'react-native-reanimated';

const SWIPE_THRESHOLD = 0.35; // fraction of screen width to trigger
const ACTION_WIDTH = 96;

export function SwipeablePhraseView({ phrase }: { phrase: Phrase }) {
    const { colors } = useTheme();
    const { handleDeletePhrase } = useDeletePhrase();

    const translateX = useSharedValue(0);
    const startX = useSharedValue(0);
    const screenWidth = useSharedValue(0);

    const confirmDelete = () => {
        Alert.alert('Delete phrase', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: () => {
                    handleDeletePhrase(phrase.id).catch(() => {
                        Alert.alert('Delete failed', 'Please try again.');
                    });
                },
            },
        ]);
    };

    const pan = Gesture.Pan()
        .activeOffsetX([-15, 15]) // don't hijack vertical scrolls
        .onStart(() => {
            startX.value = translateX.value;
        })
        .onUpdate((event) => {
            const next = startX.value + event.translationX;
            // only allow swiping left
            translateX.value = Math.min(0, next);
        })
        .onEnd(() => {
            const passedThreshold =
                Math.abs(translateX.value) > screenWidth.value * SWIPE_THRESHOLD;

            if (passedThreshold) {
                // fly off-screen, then confirm
                translateX.value = withSpring(-screenWidth.value, {}, () => {
                    runOnJS(confirmDelete)();
                    runOnJS(resetPosition)();
                });
            } else {
                translateX.value = withSpring(0);
            }
        });

    const resetPosition = () => {
        translateX.value = 0;
    };

    const cardStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: translateX.value }],
    }));

    const deleteBackgroundStyle = useAnimatedStyle(() => {
        const progress = interpolate(
            Math.abs(translateX.value),
            [0, ACTION_WIDTH],
            [0, 1],
            Extrapolation.CLAMP
        );
        return {
            opacity: progress,
            transform: [{ scale: 0.9 + 0.1 * progress }],
        };
    });

    return (
        <View
            style={styles.wrapper}
            onLayout={(e) => {
                screenWidth.value = e.nativeEvent.layout.width;
            }}
        >
            {/* Delete background behind the card */}
            <Animated.View
                style={[
                    styles.deleteBackground,
                    { backgroundColor: '#DC2626' },
                    deleteBackgroundStyle,
                ]}
            >
                <Text style={styles.deleteLabel}>Delete</Text>
            </Animated.View>

            {/* Swipeable card */}
            <GestureDetector gesture={pan}>
                <Animated.View
                    style={[
                        styles.card,
                        {
                            borderColor: colors.border,
                            backgroundColor: colors.background,
                            boxShadow: `0px 2px 8px ${colors.shadow}`,
                        },
                        cardStyle,
                    ]}
                >
                    {Object.entries(phrase.translations).map(([lang, text], index, arr) => (
                        <View
                            key={lang}
                            style={[
                                styles.row,
                                index < arr.length - 1 && {
                                    borderBottomWidth: 1,
                                    borderStyle: 'dotted',
                                    borderBottomColor: colors.border,
                                },
                            ]}
                        >
                            <Text style={styles.flag}>{flagFor(lang)}</Text>
                            <Text
                                style={[styles.text, { color: colors.text }]}
                                numberOfLines={2}
                            >
                                {text}
                            </Text>
                        </View>
                    ))}
                </Animated.View>
            </GestureDetector>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        position: 'relative',
        borderRadius: 10,
        overflow: 'hidden',
    },
    deleteBackground: {
        ...StyleSheet.absoluteFill,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'flex-end',
        paddingRight: 24,
    },
    deleteLabel: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 15,
    },
    card: {
        borderWidth: 1,
        borderRadius: 10,
        paddingVertical: 4,
        paddingHorizontal: 12,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 10,
    },
    flag: { fontSize: 18 },
    text: { fontSize: 16, flex: 1 },
});