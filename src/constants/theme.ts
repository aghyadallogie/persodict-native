export const Colors = {
    light: {
        background: '#ececedff',
        inputBackground: '#acacad44',
        inputBorder: '#343434',
        inputShadow: 'rgba(0, 0, 0, 0.2)',
        text: '#11111183',
        textMuted: '#6B728077',
        primary: 'rgba(112, 112, 112, 0.99)',
        border: '#f5f7fB',
        shadow: 'rgba(89, 89, 89, 0.5)',
        danger: '#DC2626',
        success: '#16A34A',
        white: '#FFFFFF',
        // Google's branding guidelines: light and dark variants of the sign-in button.
        googleButton: '#FFFFFF',
        googleButtonBorder: '#747775',
        googleButtonText: '#1F1F1F',
    },
    dark: {
        background: '#1c1d1dff',
        inputBackground: '#161616',
        inputBorder: 'rgba(228, 224, 224, 0.44)',
        inputShadow: 'rgba(228, 224, 224, 0.44)',
        text: '#F5F5F5aa',
        textMuted: '#9CA3AF77',
        primary: 'rgba(161, 139, 94, 0.99)',
        // Use rgba() for any color with alpha: React Native accepts rgb() with 4 values, but
        // Reanimated's own color parser doesn't, and an invalid color breaks animated styles.
        border: 'rgba(99, 99, 99, 0.16)',
        shadow: 'rgba(0, 0, 0, 0.9)',
        danger: '#DC2626',
        success: '#16A34A',
        white: '#FFFFFF',
        googleButton: '#131314',
        googleButtonBorder: '#8E918F',
        googleButtonText: '#E3E3E3',
    },
};