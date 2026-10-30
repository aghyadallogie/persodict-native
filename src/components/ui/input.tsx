import { ThemeColors, useThemedStyles } from '@/lib/use-themed-styles';
import { Platform, StyleSheet, TextInput, TextInputProps } from 'react-native';

export function Input({ style, placeholderTextColor, ...rest }: TextInputProps) {
  const { styles, colors, isDark } = useThemedStyles(createStyles);

  return (
    <TextInput
      key={isDark ? 'dark' : 'light'}
      placeholderTextColor={placeholderTextColor ?? colors.textMuted}
      style={[styles.input, style]}
      {...rest}
    />
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    input: {
      borderWidth: 1,
      borderRadius: 10,
      borderColor: colors.border,
      borderTopColor: colors.shadow,
      borderLeftColor: colors.shadow,
      borderRightColor: colors.border,
      borderBottomColor: colors.border,
      backgroundColor: colors.inputBackground,
      boxShadow: `inset 0px 2px 8px ${colors.shadow}`,
      color: colors.text,
      height: 54,
      paddingVertical: 0,
      textAlignVertical: 'center',
      paddingLeft: 12,
      paddingRight: 12,
      fontSize: 16,
      fontFamily: Platform.select({ android: 'sans-serif' }),
    },
  });
