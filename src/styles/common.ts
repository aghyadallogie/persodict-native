import type { useTheme } from '@/lib/theme';

type Colors = ReturnType<typeof useTheme>['colors'];

export function commonStyles(colors: Colors) {
    return {
        button: {
            borderRadius: 10,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.primary,
        } as const,
        buttonDisabled: { opacity: 0.5 } as const,
        input: {
            borderWidth: 1,
            borderRadius: 10,
            borderColor: colors.border,
            color: colors.text,
            paddingVertical: 15,
            paddingHorizontal: 16,
            fontSize: 16,
            boxShadow: `0px 2px 8px ${colors.shadow}`,
        } as const,
        error: {
            color: '#DC2626',
            fontSize: 13,
            textAlign: 'center',
        } as const,
        card: {
            borderWidth: 1,
            borderRadius: 10,
            borderColor: colors.border,
            backgroundColor: colors.background,
            boxShadow: `0px 2px 8px ${colors.shadow}`,
        } as const,
    };
}