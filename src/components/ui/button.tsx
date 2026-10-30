import { ThemeColors, useThemedStyles } from '@/lib/use-themed-styles';
import { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, TextStyle, ViewStyle } from 'react-native';

type Props = {
  children: ReactNode;
  onPress?: () => void;
  width?: number;
  disabled?: boolean;
  style?: ViewStyle | ViewStyle[];
  textStyle?: TextStyle;
  accessibilityLabel?: string;
};

export function Button({
  children,
  onPress,
  width = 66,
  disabled = false,
  style,
  textStyle,
  accessibilityLabel,
}: Props) {
  const { styles } = useThemedStyles(createStyles);

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        styles.button,
        { width },
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      {typeof children === 'string' ? (
        <Text style={[styles.text, textStyle]}>{children}</Text>
      ) : (
        children
      )}
    </Pressable>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    button: {
      backgroundColor: 'transparent',
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      boxShadow: `2px 4px 8px ${colors.shadow}`,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 12,
      paddingHorizontal: 16,
      paddingVertical: 13,
    },
    pressed: { opacity: 0.85 },
    disabled: { opacity: 0.5 },
    text: {
      color: colors.primary,
      fontSize: 18,
      letterSpacing: 0.9,
      fontWeight: '600',
    },
  });
