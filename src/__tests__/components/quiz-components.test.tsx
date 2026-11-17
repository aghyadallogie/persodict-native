import { OptionButton, type OptionState } from '@/components/quiz/option-button';
import { QuizLocked } from '@/components/quiz/quiz-locked';
import { StreakCounter } from '@/components/quiz/streak-counter';
import { fireEvent, render, screen } from '@testing-library/react-native';

jest.mock('@/lib/theme', () => ({
    useTheme: () => ({
        colors: jest.requireActual('@/constants/theme').Colors.light,
        isDark: false,
        mode: null,
        setMode: jest.fn(),
    }),
}));
jest.mock('expo-router', () => ({ router: { navigate: jest.fn() } }));

describe('OptionButton', () => {
    it('shows the label and reports presses', async () => {
        const onPress = jest.fn();
        await render(<OptionButton label="Apfel" state="idle" onPress={onPress} />);

        await fireEvent.press(screen.getByRole('button', { name: 'Apfel' }));

        expect(onPress).toHaveBeenCalledTimes(1);
    });

    it('ignores presses when disabled', async () => {
        const onPress = jest.fn();
        await render(<OptionButton label="Apfel" state="idle" disabled onPress={onPress} />);

        await fireEvent.press(screen.getByRole('button', { name: 'Apfel' }));

        expect(onPress).not.toHaveBeenCalled();
    });

    it.each<OptionState>(['correct', 'wrong', 'dimmed'])(
        'keeps its label when it animates from idle to %s',
        async (next) => {
            const { rerender } = await render(
                <OptionButton label="Apfel" state="idle" onPress={jest.fn()} />
            );

            await rerender(<OptionButton label="Apfel" state={next} disabled onPress={jest.fn()} />);

            expect(screen.getByRole('button', { name: 'Apfel' })).toBeTruthy();
            expect(screen.getByText('Apfel')).toBeTruthy();
        }
    );
});

describe('StreakCounter', () => {
    it('shows the current streak and updates it', async () => {
        const { rerender } = await render(<StreakCounter streak={0} />);
        expect(screen.getByText('Streak: 0')).toBeTruthy();

        await rerender(<StreakCounter streak={1} />);
        expect(screen.getByText('Streak: 1')).toBeTruthy();

        await rerender(<StreakCounter streak={0} />);
        expect(screen.getByText('Streak: 0')).toBeTruthy();
        expect(screen.getByLabelText('Streak 0')).toBeTruthy();
    });
});

describe('QuizLocked', () => {
    it('shows the count and a progress bar clamped to the minimum', async () => {
        await render(<QuizLocked count={12} min={8} />);

        expect(screen.getByText('12 / 8')).toBeTruthy();
        expect(screen.getByRole('progressbar')).toBeTruthy();
    });
});
