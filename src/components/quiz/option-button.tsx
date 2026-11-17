import { ThemeColors, useThemedStyles } from '@/lib/use-themed-styles';
import { useEffect } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, {
    interpolateColor,
    useAnimatedStyle,
    useSharedValue,
    withSequence,
    withSpring,
    withTiming,
} from 'react-native-reanimated';

const OPTION_HEIGHT = 68;
const FILL_MS = 180;

/**
 * idle: nothing chosen yet. correct / wrong: shown after an answer. dimmed: the other options
 * once an answer is showing.
 */
export type OptionState = 'idle' | 'correct' | 'wrong' | 'dimmed';

type Props = {
    label: string;
    state: OptionState;
    disabled?: boolean;
    onPress: () => void;
};

/**
 * One answer option. When its state changes it fades to green/red, the correct option pops,
 * a wrong choice shakes, and the untouched options dim.
 */
export function OptionButton({ label, state, disabled = false, onPress }: Props) {
    const { styles, colors } = useThemedStyles(createStyles);
    const filled = state === 'correct' || state === 'wrong';
    const fillColor = state === 'wrong' ? colors.danger : colors.success;

    // 0 = neutral look, 1 = filled with fillColor
    const fill = useSharedValue(0);
    const opacity = useSharedValue(1);
    const scale = useSharedValue(1);
    const shakeX = useSharedValue(0);

    useEffect(() => {
        fill.value = withTiming(filled ? 1 : 0, { duration: FILL_MS });
        opacity.value = withTiming(state === 'dimmed' ? 0.5 : 1, { duration: FILL_MS });

        if (state === 'correct') {
            scale.value = withSequence(withTiming(1.05, { duration: 110 }), withSpring(1));
        } else if (state === 'wrong') {
            shakeX.value = withSequence(
                withTiming(-8, { duration: 50 }),
                withTiming(8, { duration: 80 }),
                withTiming(-6, { duration: 70 }),
                withTiming(6, { duration: 60 }),
                withTiming(0, { duration: 50 })
            );
        }
    }, [state, filled, fill, opacity, scale, shakeX]);

    const optionStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [{ translateX: shakeX.value }, { scale: scale.value }],
        backgroundColor: interpolateColor(fill.value, [0, 1], [colors.background, fillColor]),
        borderColor: interpolateColor(fill.value, [0, 1], [colors.border, fillColor]),
    }));

    const labelStyle = useAnimatedStyle(() => ({
        color: interpolateColor(fill.value, [0, 1], [colors.text, colors.white]),
    }));

    return (
        <Pressable
            onPress={onPress}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityLabel={label}
            accessibilityState={{ disabled }}
            style={({ pressed }) => pressed && !disabled && styles.pressed}
        >
            <Animated.View style={[styles.option, optionStyle]}>
                <Animated.Text
                    style={[styles.label, labelStyle]}
                    numberOfLines={2}
                    adjustsFontSizeToFit
                    minimumFontScale={0.7}
                >
                    {label}
                </Animated.Text>
            </Animated.View>
        </Pressable>
    );
}

const createStyles = (colors: ThemeColors) =>
    StyleSheet.create({
        option: {
            borderWidth: 1,
            borderRadius: 10,
            borderColor: colors.border,
            backgroundColor: colors.background,
            boxShadow: `0px 2px 8px ${colors.shadow}`,
            // Fixed height: a long label shrinks (up to 2 lines) instead of growing the button,
            // so the layout never shifts between questions.
            height: OPTION_HEIGHT,
            paddingHorizontal: 16,
            alignItems: 'center',
            justifyContent: 'center',
        },
        pressed: { opacity: 0.85 },
        label: { color: colors.text, fontSize: 18, lineHeight: 22, textAlign: 'center' },
    });
