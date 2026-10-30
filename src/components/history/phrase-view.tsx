import type { Phrase } from '@/features/history/types';
import { useDeletePhrase } from '@/features/history/use-delete-phrase';
import { flagFor } from '@/lib/lang-flag';
import { ThemeColors, useThemedStyles } from '@/lib/use-themed-styles';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    Extrapolation,
    FadeInDown,
    FadeOutLeft,
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

const EXIT_MS = 250;
const SWIPE_THRESHOLD = 0.4;
const FLING_VELOCITY = -900;

type Props = {
    phrase: Phrase;
    waitForExit?: boolean;
};

export function PhraseView({ phrase, waitForExit = false }: Props) {
    const { styles } = useThemedStyles(createStyles);
    const { handleDeletePhrase } = useDeletePhrase();

    const translateX = useSharedValue(0);
    const startX = useSharedValue(0);
    const cardWidth = useSharedValue(0);

    const entries = Object.entries(phrase.translations);

    const onDelete = () => {
        handleDeletePhrase(phrase.id).catch(() => {
            translateX.value = withTiming(0);
            Alert.alert('Delete failed', 'Please try again.');
        });
    };

    const pan = Gesture.Pan()
        .activeOffsetX([-15, 15])
        .failOffsetY([-10, 10])
        .onStart(() => {
            startX.value = translateX.value;
        })
        .onUpdate((event) => {
            translateX.value = Math.min(0, startX.value + event.translationX);
        })
        .onEnd((event) => {
            const passed =
                -translateX.value > cardWidth.value * SWIPE_THRESHOLD ||
                event.velocityX < FLING_VELOCITY;

            if (passed) {
                translateX.value = withTiming(-cardWidth.value, { duration: 180 }, (finished) => {
                    if (finished) scheduleOnRN(onDelete);
                });
            } else {
                translateX.value = withTiming(0, { duration: 180 });
            }
        });

    const cardStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: translateX.value }],
    }));

    const hintStyle = useAnimatedStyle(() => ({
        opacity: interpolate(-translateX.value, [0, 80], [0, 1], Extrapolation.CLAMP),
    }));

    return (
        <Animated.View
            entering={FadeInDown.delay(waitForExit ? EXIT_MS : 0).duration(300)}
            exiting={FadeOutLeft.duration(EXIT_MS)}
            onLayout={(e) => {
                cardWidth.value = e.nativeEvent.layout.width;
            }}
        >
            <Animated.View style={[styles.hint, hintStyle]}>
                <Text style={styles.hintText}>Delete</Text>
            </Animated.View>

            <GestureDetector gesture={pan}>
                <Animated.View style={[styles.card, cardStyle]}>
                    {entries.map(([lang, text], index) => (
                        <View
                            key={lang}
                            style={[styles.row, index < entries.length - 1 && styles.rowDivider]}
                        >
                            <Text style={styles.flag}>{flagFor(lang)}</Text>
                            <Text style={styles.text} numberOfLines={2}>
                                {text}
                            </Text>
                        </View>
                    ))}
                </Animated.View>
            </GestureDetector>
        </Animated.View>
    );
}

const createStyles = (colors: ThemeColors) =>
    StyleSheet.create({
        card: {
            borderWidth: 1,
            borderRadius: 10,
            borderColor: colors.border,
            backgroundColor: colors.background,
            boxShadow: `0px 2px 8px ${colors.shadow}`,
            paddingVertical: 4,
            paddingHorizontal: 15,
        },
        row: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            paddingVertical: 6,
        },
        rowDivider: {
            borderBottomWidth: 1,
            borderStyle: 'dotted',
            borderBottomColor: colors.border,
        },
        flag: { fontSize: 20 },
        text: {
            color: colors.text,
            fontSize: 16,
            flex: 1,
            textAlign: 'right',
            paddingRight: 4
        },
        hint: {
            ...StyleSheet.absoluteFill,
            borderRadius: 10,
            backgroundColor: '#DC2626',
            justifyContent: 'center',
            alignItems: 'flex-end',
            paddingRight: 24,
        },
        hintText: {
            color: '#fff',
            fontWeight: '700',
            fontSize: 15,
        },
    });
