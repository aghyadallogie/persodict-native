import { Button } from '@/components/ui/button';
import { ThemeColors, useThemedStyles } from '@/lib/use-themed-styles';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
    Easing,
    FadeInDown,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';

type Props = {
    /** Phrases in History so far. */
    count: number;
    /** Phrases needed to unlock the quiz. */
    min: number;
};

/** Shown on the Quiz tab until the user has enough phrases, with progress towards unlocking it. */
export function QuizLocked({ count, min }: Props) {
    const { styles } = useThemedStyles(createStyles);
    const progress = Math.min(1, count / min);

    // The bar fills up from empty on mount, and animates again when a phrase is added.
    const filled = useSharedValue(0);
    useEffect(() => {
        filled.value = withTiming(progress, { duration: 600, easing: Easing.out(Easing.cubic) });
    }, [progress, filled]);
    const fillStyle = useAnimatedStyle(() => ({ width: `${filled.value * 100}%` }));

    return (
        <Animated.View entering={FadeInDown.duration(300)} style={styles.container}>
            <Text style={styles.title}>Quiz locked</Text>
            <Text style={styles.message}>
                Translate at least {min} phrases to unlock the quiz.
            </Text>

            <View
                style={styles.track}
                accessible
                accessibilityRole="progressbar"
                accessibilityValue={{ min: 0, max: min, now: Math.min(count, min) }}
            >
                <Animated.View style={[styles.fill, fillStyle]} />
            </View>
            <Text style={styles.count}>
                {count} / {min}
            </Text>

            <Button width={220} onPress={() => router.navigate('/home')} style={styles.cta}>
                Translate
            </Button>
        </Animated.View>
    );
}

const createStyles = (colors: ThemeColors) =>
    StyleSheet.create({
        container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 12 },
        title: { color: colors.text, fontSize: 22, fontWeight: '600' },
        message: { color: colors.textMuted, fontSize: 15, textAlign: 'center' },
        track: {
            width: '100%',
            height: 8,
            borderRadius: 4,
            backgroundColor: colors.inputBackground,
            overflow: 'hidden',
            marginTop: 12,
        },
        fill: { height: '100%', borderRadius: 4, backgroundColor: colors.primary },
        count: { color: colors.text, fontSize: 15, fontWeight: '600' },
        cta: { marginTop: 16 },
    });
