import { useTheme } from '@/lib/theme';
import { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, TextStyle, ViewStyle } from 'react-native';

type Props = {
  children: ReactNode;
  onPress?: () => void;
  width?: number;
  hasSlimBorder?: boolean;
  disabled?: boolean;
  style?: ViewStyle | ViewStyle[];
  textStyle?: TextStyle;
  accessibilityLabel?: string;
};

export function Button({
  children,
  onPress,
  width = 66,
  hasSlimBorder = false,
  disabled = false,
  style,
  textStyle,
  accessibilityLabel,
}: Props) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        styles.button,
        {
          width,
          borderColor: colors.border,
          boxShadow: `1px 3px 10px ${colors.shadow}`,
        },
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      {typeof children === 'string' ? (
        <Text style={[styles.text, { color: colors.primary }, textStyle]}>
          {children}
        </Text>
      ) : (
        children
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: 'transparent',
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.5 },
  text: {
    fontSize: 18,
    letterSpacing: 0.9,
    fontWeight: '600',
  },
});