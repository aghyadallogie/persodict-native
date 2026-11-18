import { Button } from '@/components/ui/button';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { StyleSheet, Text } from 'react-native';

jest.mock('@/lib/theme', () => ({
    useTheme: () => ({
        colors: jest.requireActual('@/constants/theme').Colors.light,
        isDark: false,
        mode: null,
        setMode: jest.fn(),
    }),
}));

// The test renderer has no query for a spinner, so stand in a recognisable one.
jest.mock('react-native/Libraries/Components/ActivityIndicator/ActivityIndicator', () => {
    const React = jest.requireActual<typeof import('react')>('react');
    return {
        __esModule: true,
        default: function MockSpinner() {
            const { Text: RNText } = jest.requireActual<typeof import('react-native')>('react-native');
            return React.createElement(RNText, null, 'SPINNER');
        },
    };
});

type Style = {
    boxShadow?: string;
    transform?: { translateY?: number }[];
    opacity?: number;
    minHeight?: number;
    width?: number | string;
    paddingVertical?: number;
    paddingHorizontal?: number;
};

const button = () => screen.getByRole('button');
const style = () => StyleSheet.flatten(button().props.style as never) as Style;
const SIZE = ['minHeight', 'width', 'paddingVertical', 'paddingHorizontal'] as const;
const sizeOf = () => Object.fromEntries(SIZE.map((key) => [key, style()[key]]));

describe('Button loading', () => {
    it('shows a spinner instead of the icon and the label', async () => {
        await render(
            <Button loading icon={<Text>ICON</Text>}>
                Label
            </Button>
        );

        expect(screen.getByText('SPINNER')).toBeTruthy();
        expect(screen.queryByText('Label')).toBeNull();
        expect(screen.queryByText('ICON')).toBeNull();
    });

    it('shows a spinner instead of non-text children too (e.g. the translate icon)', async () => {
        await render(
            <Button loading>
                <Text>TRANSLATE-ICON</Text>
            </Button>
        );

        expect(screen.getByText('SPINNER')).toBeTruthy();
        expect(screen.queryByText('TRANSLATE-ICON')).toBeNull();
    });

    it('shows its normal content, and no spinner, when not loading', async () => {
        await render(<Button icon={<Text>ICON</Text>}>Label</Button>);

        expect(screen.getByText('Label')).toBeTruthy();
        expect(screen.getByText('ICON')).toBeTruthy();
        expect(screen.queryByText('SPINNER')).toBeNull();
    });

    it('looks pressed in for as long as it is loading, with no finger on it', async () => {
        await render(<Button loading>Label</Button>);

        expect(style().boxShadow).toMatch(/^inset /);
        expect(style().transform).toEqual([{ translateY: 1 }]);
    });

    it('is not dimmed while loading, even if it is also disabled', async () => {
        await render(
            <Button loading disabled>
                Label
            </Button>
        );

        expect(style().opacity).toBeUndefined();
        expect(style().boxShadow).toMatch(/^inset /);
    });

    it('is still dimmed when it is merely disabled (not loading)', async () => {
        await render(<Button disabled>Label</Button>);

        expect(style().opacity).toBe(0.5);
        expect(style().boxShadow).not.toMatch(/inset/);
    });

    it('ignores presses while loading', async () => {
        const onPress = jest.fn();
        await render(
            <Button loading onPress={onPress}>
                Label
            </Button>
        );

        await fireEvent.press(button());

        expect(onPress).not.toHaveBeenCalled();
    });

    it('tells assistive technology that it is busy and unavailable', async () => {
        await render(<Button loading>Label</Button>);

        expect(button().props.accessibilityState).toMatchObject({
            busy: true,
            disabled: true,
        });
    });

    it('is not marked busy when idle', async () => {
        await render(<Button>Label</Button>);

        expect(button().props.accessibilityState).toMatchObject({
            busy: false,
            disabled: false,
        });
    });

    it('pops back up, with its content, as soon as loading ends', async () => {
        const onPress = jest.fn();
        const { rerender } = await render(
            <Button loading onPress={onPress}>
                Label
            </Button>
        );
        expect(style().boxShadow).toMatch(/^inset /);

        await rerender(<Button onPress={onPress}>Label</Button>);

        expect(style().boxShadow).not.toMatch(/inset/);
        expect(style().transform).toBeUndefined();
        expect(screen.getByText('Label')).toBeTruthy();
        expect(screen.queryByText('SPINNER')).toBeNull();
        await fireEvent.press(button());
        expect(onPress).toHaveBeenCalledTimes(1);
    });
});

describe('Button size', () => {
    it('has a minimum height equal to <Input> so form rows line up', async () => {
        await render(<Button>Label</Button>);

        expect(style().minHeight).toBe(54);
    });

    it('does not change size when it starts loading (text label)', async () => {
        const { rerender } = await render(<Button width={220}>Label</Button>);
        const idle = sizeOf();

        await rerender(
            <Button width={220} loading>
                Label
            </Button>
        );

        expect(sizeOf()).toEqual(idle);
    });

    it('does not change size when it starts loading (icon-only, like the translate button)', async () => {
        const { rerender } = await render(
            <Button>
                <Text>ICON</Text>
            </Button>
        );
        const idle = sizeOf();

        await rerender(
            <Button loading>
                <Text>ICON</Text>
            </Button>
        );

        expect(sizeOf()).toEqual(idle);
    });

    it('is the same size whatever it contains: label, label with icon, icon only, spinner', async () => {
        const variants = [
            <Button key="a">Label</Button>,
            <Button key="b" icon={<Text>I</Text>}>
                Label
            </Button>,
            <Button key="c">
                <Text>I</Text>
            </Button>,
            <Button key="d" loading>
                Label
            </Button>,
        ];

        const sizes: Record<string, unknown>[] = [];
        for (const variant of variants) {
            const { unmount } = await render(variant);
            sizes.push(sizeOf());
            await unmount();
        }

        for (const size of sizes) expect(size).toEqual(sizes[0]);
    });

    it('keeps a caller-chosen width while loading', async () => {
        await render(
            <Button loading style={{ width: '100%' }}>
                Label
            </Button>
        );

        expect(style().width).toBe('100%');
    });
});
