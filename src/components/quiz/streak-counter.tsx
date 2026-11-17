import { ThemeColors, useThemedStyles } from '@/lib/use-themed-styles';
import { useEffect, useRef } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSequence,
    withSpring,
    withTiming,
} from 'react-native-reanimated';

/** "Streak: n". Pops when the streak grows and dips when it resets. */
export function StreakCounter({ streak }: { streak: number }) {
    const { styles } = useThemedStyles(createStyles);
    const scale = useSharedValue(1);
    const previous = useRef(streak);

    useEffect(() => {
        if (streak > previous.current) {
            scale.value = withSequence(withTiming(1.35, { duration: 120 }), withSpring(1));
        } else if (streak < previous.current) {
            scale.value = withSequence(withTiming(0.8, { duration: 100 }), withSpring(1));
        }
        previous.current = streak;
    }, [streak, scale]);

    const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

    return (
        <Animated.Text
            style={[styles.text, animatedStyle]}
            accessibilityLabel={`Streak ${streak}`}
        >
            Streak: {streak}
        </Animated.Text>
    );
}

const createStyles = (colors: ThemeColors) =>
    StyleSheet.create({
        text: { color: colors.textMuted, fontSize: 15, fontWeight: '600', textAlign: 'center' },
    });
