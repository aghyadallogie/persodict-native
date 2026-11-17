import QuizScreen from '@/app/(tabs)/quiz';
import type { Question } from '@/features/quiz/build-question';
import { useQuiz } from '@/features/quiz/use-quiz';
import { fireEvent, render, screen } from '@testing-library/react-native';

jest.mock('@/features/quiz/use-quiz', () => ({ useQuiz: jest.fn() }));
jest.mock('@/lib/theme', () => ({
    useTheme: () => ({
        colors: jest.requireActual('@/constants/theme').Colors.light,
        isDark: false,
        mode: null,
        setMode: jest.fn(),
    }),
}));
jest.mock('expo-router', () => ({ router: { navigate: jest.fn() } }));

const answer = jest.fn();
const retry = jest.fn();

const question: Question = {
    phraseId: '1',
    promptLang: 'en',
    prompt: 'apple',
    targetLang: 'de',
    answer: 'Apfel',
    options: ['Haus', 'Apfel', 'Wasser', 'Buch'],
};

function mockQuiz(overrides: Partial<ReturnType<typeof useQuiz>>) {
    (useQuiz as jest.Mock).mockReturnValue({
        status: 'playing',
        question,
        selected: null,
        streak: 0,
        answer,
        phraseCount: 10,
        minPhrases: 8,
        retry,
        ...overrides,
    });
}

beforeEach(() => {
    answer.mockReset();
    retry.mockReset();
});

describe('QuizScreen', () => {
    it('shows progress towards unlocking when there are too few phrases', async () => {
        mockQuiz({ status: 'locked', question: null, phraseCount: 3 });
        await render(<QuizScreen />);

        expect(screen.getByText('3 / 8')).toBeTruthy();
        expect(screen.getByText('Translate')).toBeTruthy();
        expect(screen.queryByText('apple')).toBeNull();
    });

    it('shows the prompt, the streak and all four options', async () => {
        mockQuiz({ streak: 3 });
        await render(<QuizScreen />);

        expect(screen.getByText('apple')).toBeTruthy();
        expect(screen.getByText('Streak: 3')).toBeTruthy();
        for (const option of question.options) {
            expect(screen.getByRole('button', { name: option })).toBeTruthy();
        }
    });

    it('reports the tapped option', async () => {
        mockQuiz({});
        await render(<QuizScreen />);

        await fireEvent.press(screen.getByRole('button', { name: 'Haus' }));

        expect(answer).toHaveBeenCalledWith('Haus');
    });

    it('does not accept more taps while an answer is showing', async () => {
        mockQuiz({ selected: 'Haus' });
        await render(<QuizScreen />);

        await fireEvent.press(screen.getByRole('button', { name: 'Wasser' }));

        expect(answer).not.toHaveBeenCalled();
    });

    it('offers a retry when loading fails', async () => {
        mockQuiz({ status: 'error', question: null });
        await render(<QuizScreen />);

        await fireEvent.press(screen.getByText('Retry'));

        expect(retry).toHaveBeenCalledTimes(1);
    });

    it('explains when no quiz can be built from the selected languages', async () => {
        mockQuiz({ status: 'unavailable', question: null });
        await render(<QuizScreen />);

        expect(screen.getByText('No quiz yet')).toBeTruthy();
        expect(screen.getByText('Choose languages')).toBeTruthy();
    });
});
