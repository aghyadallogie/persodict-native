import { ThemeColors, useThemedStyles } from "@/lib/use-themed-styles";
import { ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextStyle,
  ViewStyle,
} from "react-native";

/**
 * Every button is at least this tall (the same height as `<Input>`, so form rows line up). It is
 * more than the tallest content we show (a 24px icon, an 18px label or a 20px spinner, plus
 * padding and border), so swapping one for another never changes the button's size.
 */
const MIN_HEIGHT = 54;

type Props = {
  children: ReactNode;
  /** Shown before a text label, e.g. a logo. */
  icon?: ReactNode;
  onPress?: () => void;
  /**
   * Work is in progress: shows a spinner instead of the icon and label, keeps the button looking
   * pressed in (not dimmed) until it's done, and ignores presses.
   */
  loading?: boolean;
  width?: number;
  disabled?: boolean;
  style?: ViewStyle | ViewStyle[];
  textStyle?: TextStyle;
  accessibilityLabel?: string;
};

export function Button({
  children,
  icon,
  onPress,
  loading = false,
  width = 66,
  disabled = false,
  style,
  textStyle,
  accessibilityLabel,
}: Props) {
  const { styles, colors } = useThemedStyles(createStyles);
  const blocked = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={blocked}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: blocked, busy: loading }}
      style={({ pressed }) => [
        styles.button,
        { width },
        // A loading button stays pushed in until the work is done.
        (pressed || loading) && styles.pressed,
        // ...and is not dimmed: dimming is for buttons that can't be used right now.
        disabled && !loading && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.primary} />
      ) : (
        <>
          {icon}
          {typeof children === "string" ? (
            <Text style={[styles.text, textStyle]}>{children}</Text>
          ) : (
            children
          )}
        </>
      )}
    </Pressable>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    button: {
      backgroundColor: "transparent",
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      boxShadow: `2px 4px 8px ${colors.shadow}`,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: 12,
      paddingHorizontal: 16,
      paddingVertical: 13,
      minHeight: MIN_HEIGHT,
    },
    // Looks physically pressed: the raised drop shadow is replaced by an inset one (the same kind
    // <Input> uses) and the button sits 1px lower, instead of just fading.
    pressed: {
      boxShadow: `inset 1px 1px 1px ${colors.shadow}`,
      transform: [{ translateY: 1 }],
    },
    disabled: { opacity: 0.5 },
    text: {
      color: colors.primary,
      fontSize: 18,
      letterSpacing: 0.9,
      fontWeight: "600",
    },
  });
