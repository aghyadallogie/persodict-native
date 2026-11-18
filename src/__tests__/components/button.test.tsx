import { Colors } from '@/constants/theme';
import { Button } from '@/components/ui/button';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

jest.mock('@/lib/theme', () => ({
    useTheme: () => ({
        colors: jest.requireActual('@/constants/theme').Colors.light,
        isDark: false,
        mode: null,
        setMode: jest.fn(),
    }),
}));

type Look = {
    boxShadow?: string;
    transform?: { translateY?: number }[];
    opacity?: number;
};

const button = () => screen.getByRole('button');
const look = () => StyleSheet.flatten(button().props.style as never) as Look;

/** Holds the button down the way the touch system does, without letting go. */
async function pressAndHold() {
    const nativeEvent = {
        touches: [{ pageX: 1, pageY: 1 }],
        changedTouches: [{ pageX: 1, pageY: 1 }],
        timestamp: Date.now(),
        pageX: 1,
        pageY: 1,
        locationX: 1,
        locationY: 1,
        identifier: 1,
    };
    await fireEvent(button(), 'responderGrant', {
        nativeEvent,
        persist: () => {},
        currentTarget: 1,
    });
    return nativeEvent;
}

const shadowColor = Colors.light.shadow;

beforeEach(() => {
    jest.useFakeTimers();
});

afterEach(() => {
    jest.useRealTimers();
});

describe('Button pressed look', () => {
    it('rests with a raised drop shadow, at full opacity and in place', async () => {
        await render(<Button>Go</Button>);

        expect(look().boxShadow).toBe(`2px 4px 8px ${shadowColor}`);
        expect(look().boxShadow).not.toContain('inset');
        expect(look().transform).toBeUndefined();
        expect(look().opacity).toBeUndefined();
    });

    it('while pressed, drops the raised shadow for an inset one so it looks pushed in', async () => {
        await render(<Button>Go</Button>);

        await pressAndHold();

        // Any inset shadow in the theme's shadow color. The exact offsets are a styling choice
        // that gets tuned, so they're deliberately not pinned here.
        expect(look().boxShadow).toMatch(/^inset /);
        expect(look().boxShadow?.endsWith(shadowColor)).toBe(true);
        expect(look().boxShadow).not.toBe(`2px 4px 8px ${shadowColor}`);
    });

    it('while pressed, sits 1px lower instead of fading out', async () => {
        await render(<Button>Go</Button>);

        await pressAndHold();

        expect(look().transform).toEqual([{ translateY: 1 }]);
        expect(look().opacity).toBeUndefined();
    });

    it('uses the theme shadow color for the pressed shadow too', async () => {
        await render(<Button>Go</Button>);

        await pressAndHold();

        expect(look().boxShadow).toContain(shadowColor);
    });

    it('goes back to the raised look when released', async () => {
        await render(<Button>Go</Button>);
        const nativeEvent = await pressAndHold();
        expect(look().boxShadow).toContain('inset');

        await fireEvent(button(), 'responderRelease', {
            nativeEvent,
            persist: () => {},
            currentTarget: 1,
        });
        // React Native keeps the pressed look for a minimum time before letting go.
        await act(async () => {
            jest.advanceTimersByTime(300);
        });

        expect(look().boxShadow).toBe(`2px 4px 8px ${shadowColor}`);
        expect(look().transform).toBeUndefined();
    });

    it('a disabled button keeps its raised, dimmed look and cannot be pressed in', async () => {
        await render(<Button disabled>Go</Button>);

        await pressAndHold();

        expect(look().boxShadow).toBe(`2px 4px 8px ${shadowColor}`);
        expect(look().transform).toBeUndefined();
        expect(look().opacity).toBe(0.5);
    });

    it('still lets a caller override layout styles while pressed', async () => {
        await render(
            <Button style={{ width: '100%', marginTop: 26 }}>Go</Button>
        );

        await pressAndHold();

        const flat = look() as Look & { width?: unknown; marginTop?: number };
        expect(flat.width).toBe('100%');
        expect(flat.marginTop).toBe(26);
        expect(flat.boxShadow).toContain('inset');
    });
});
