import { useTheme } from '@/lib/theme';
import { StyleSheet, TextInput, TextInputProps } from 'react-native';

export function Input({ style, placeholderTextColor, ...rest }: TextInputProps) {
  const { colors, isDark } = useTheme();

  return (
    <TextInput
      key={isDark ? 'dark' : 'light'}
      placeholderTextColor={placeholderTextColor ?? colors.textMuted}
      style={[
        styles.input,
        {
          borderColor: colors.border,
          color: colors.text,
          borderTopColor: colors.shadow,
          borderLeftColor: colors.shadow,
          borderRightColor: colors.border,
          borderBottomColor: colors.border,
          backgroundColor: colors.inputBackground,
          boxShadow: `inset 0px 2px 8px ${colors.shadow}`,
        },
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 15,
    paddingLeft: 12,
    paddingRight: 12,
    fontSize: 16,
    lineHeight: 24
  },
});
