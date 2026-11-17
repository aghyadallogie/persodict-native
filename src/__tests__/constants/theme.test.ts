import { Colors } from '@/constants/theme';
// Reanimated's real color parser (the package root is mocked in tests, this deep import isn't).
import { normalizeColor } from 'react-native-reanimated/src/Colors';

const entries = (['light', 'dark'] as const).flatMap((mode) =>
    Object.entries(Colors[mode]).map(([name, value]) => [`${mode}.${name}`, value] as const)
);

describe('Colors', () => {
    it('defines the same tokens in light and dark', () => {
        expect(Object.keys(Colors.dark).sort()).toEqual(Object.keys(Colors.light).sort());
    });

    // Animated styles (e.g. interpolateColor in the quiz options) run theme colors through
    // Reanimated's parser, which is stricter than React Native's: `rgb()` with 4 values is
    // rejected there. An invalid color throws inside the style updater and leaves Reanimated in a
    // broken state that later shows up as an unrelated "reduceMotion on number" error.
    it.each(entries)('%s is a color Reanimated can parse', (_name, value) => {
        expect(normalizeColor(value)).not.toBeNull();
    });
});
