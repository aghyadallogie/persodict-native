import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { useTheme } from './theme';

export type ThemeColors = ReturnType<typeof useTheme>['colors'];

/**
 * Creates a themed StyleSheet inside a component.
 * Re-computes automatically when the theme changes.
 *
 * `factory` must be a stable reference (declare it at module level, not inline),
 * and should wrap its styles in `StyleSheet.create` so literal types are kept:
 *
 *   const createStyles = (colors: ThemeColors) => StyleSheet.create({ ... });
 *   const { styles } = useThemedStyles(createStyles);
 *
 * Returns `{ styles, colors, isDark }` so callers can also use
 * theme colors for props that aren't styles (e.g. placeholderTextColor).
 */
export function useThemedStyles<T extends StyleSheet.NamedStyles<T>>(
    factory: (colors: ThemeColors) => T
) {
    const { colors, isDark } = useTheme();
    const styles = useMemo(() => StyleSheet.create(factory(colors)), [colors, factory]);
    return { styles, colors, isDark };
}