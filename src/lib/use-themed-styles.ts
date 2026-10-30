import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { useTheme } from './theme';

type Colors = ReturnType<typeof useTheme>['colors'];

/**
 * Creates a themed StyleSheet inside a component.
 * Re-computes automatically when the system color scheme changes.
 *
 * Returns `{ styles, colors, isDark }` so callers can also use
 * theme colors for props that aren't styles (e.g. placeholderTextColor).
 */
export function useThemedStyles<T extends StyleSheet.NamedStyles<T>>(
    factory: (colors: Colors) => T
) {
    const { colors, isDark } = useTheme();
    const styles = useMemo(() => StyleSheet.create(factory(colors)), [colors, factory]);
    return { styles, colors, isDark };
}