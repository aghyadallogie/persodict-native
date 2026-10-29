import { useTheme } from '@/lib/theme';
import { StyleSheet, TextInput, TextInputProps } from 'react-native';

export function Input({ style, placeholderTextColor, ...rest }: TextInputProps) {
  const { colors } = useTheme();

  return (
    <TextInput
      placeholderTextColor={placeholderTextColor ?? colors.textMuted}
      style={[
        styles.input,
        {
          borderColor: colors.border,
          color: colors.text,
          boxShadow: `0px -2px -8px ${colors.shadow}`,
          borderTopColor: colors.shadow,
          borderLeftColor: colors.shadow,
          borderRightColor: colors.border,
          borderBottomColor: colors.border,
          backgroundColor: colors.inputBackground,
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
    paddingHorizontal: 12,
    fontSize: 16,
  },
});
