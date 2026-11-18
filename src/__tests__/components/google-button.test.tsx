import { GoogleButton } from '@/components/auth/google-button';
import { Button } from '@/components/ui/button';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { StyleSheet, Text, View } from 'react-native';

jest.mock('@/lib/theme', () => ({
    useTheme: () => ({
        colors: jest.requireActual('@/constants/theme').Colors.light,
        isDark: false,
        mode: null,
        setMode: jest.fn(),
    }),
}));

const googleButton = () => screen.getByRole('button', { name: 'Continue with Google' });

/** The visual properties that make a button look like "one of our buttons". */
const LOOK = [
    'borderRadius',
    'borderWidth',
    'borderColor',
    'backgroundColor',
    'boxShadow',
    'paddingVertical',
    'paddingHorizontal',
    'flexDirection',
    'alignItems',
    'justifyContent',
    'gap',
] as const;

const lookOf = (element: { props: { style?: unknown } }) => {
    const flat = StyleSheet.flatten(element.props.style as never) as Record<string, unknown>;
    return Object.fromEntries(LOOK.map((key) => [key, flat[key]]));
};

describe('GoogleButton', () => {
    it('shows the label and reports presses', async () => {
        const onPress = jest.fn();
        await render(<GoogleButton onPress={onPress} />);

        expect(screen.getByText('Continue with Google')).toBeTruthy();
        await fireEvent.press(googleButton());

        expect(onPress).toHaveBeenCalledTimes(1);
    });

    it('ignores presses when disabled', async () => {
        const onPress = jest.fn();
        await render(<GoogleButton onPress={onPress} disabled />);

        await fireEvent.press(googleButton());

        expect(onPress).not.toHaveBeenCalled();
    });

    it('swaps the label for a spinner while loading, stays accessible, and ignores presses', async () => {
        const onPress = jest.fn();
        await render(<GoogleButton onPress={onPress} loading />);

        expect(screen.queryByText('Continue with Google')).toBeNull();
        await fireEvent.press(googleButton()); // still found by its accessibility label

        expect(onPress).not.toHaveBeenCalled();
    });

    it("looks exactly like the app's shared Button", async () => {
        await render(
            <View>
                <Button accessibilityLabel="Reference" style={{ width: '100%' }}>
                    Reference
                </Button>
                <GoogleButton onPress={jest.fn()} />
            </View>
        );

        const reference = screen.getByRole('button', { name: 'Reference' });

        expect(lookOf(googleButton())).toEqual(lookOf(reference));
        // Sanity: the comparison above isn't vacuously comparing empty styles.
        expect(lookOf(reference).borderRadius).toBe(10);
        expect(lookOf(reference).boxShadow).toBeTruthy();
    });

    it('is full width, like the form submit button', async () => {
        await render(<GoogleButton onPress={jest.fn()} />);

        const flat = StyleSheet.flatten(googleButton().props.style as never) as {
            width?: unknown;
        };

        expect(flat.width).toBe('100%');
    });

    it('uses the same text style as the shared Button label', async () => {
        await render(
            <View>
                <Button>Reference</Button>
                <GoogleButton onPress={jest.fn()} />
            </View>
        );

        const flatten = (el: { props: { style?: unknown } }) =>
            StyleSheet.flatten(el.props.style as never) as Record<string, unknown>;
        const reference = flatten(screen.getByText('Reference'));
        const google = flatten(screen.getByText('Continue with Google'));

        for (const key of ['color', 'fontSize', 'fontWeight', 'letterSpacing']) {
            expect(google[key]).toBe(reference[key]);
        }
    });
});

describe('Button icon', () => {
    it('renders the icon next to the text label', async () => {
        await render(<Button icon={<Text>ICON</Text>}>Label</Button>);

        expect(screen.getByText('ICON')).toBeTruthy();
        expect(screen.getByText('Label')).toBeTruthy();
    });

    it('is optional: a plain text button renders as before', async () => {
        await render(<Button>Label</Button>);

        expect(screen.getByText('Label')).toBeTruthy();
        expect(screen.queryByText('ICON')).toBeNull();
    });
});
