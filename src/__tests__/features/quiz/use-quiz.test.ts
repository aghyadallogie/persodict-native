import type { Phrase } from '@/features/history/types';
import { useHistory } from '@/features/history/use-history';
import { MIN_PHRASES } from '@/features/quiz/build-question';
import { NEXT_QUESTION_DELAY_MS, useQuiz } from '@/features/quiz/use-quiz';
import { useSettings } from '@/features/settings/use-settings';
import { correctHaptic, wrongHaptic } from '@/lib/haptics';
import { act, renderHook } from '@testing-library/react-native';

jest.mock('@/features/history/use-history', () => ({ useHistory: jest.fn() }));
jest.mock('@/features/settings/use-settings', () => ({ useSettings: jest.fn() }));
jest.mock('@/lib/haptics', () => ({ correctHaptic: jest.fn(), wrongHaptic: jest.fn() }));

const words = ['apple', 'house', 'water', 'book', 'tree', 'dog', 'sun', 'moon', 'star', 'rain'];

const makePhrases = (count: number): Phrase[] =>
    words.slice(0, count).map((en, i) => ({
        id: String(i + 1),
        authorId: 'u1',
        translations: { en, de: `de-${en}` },
    }));

function mockData({
    phrases = makePhrases(MIN_PHRASES),
    langs = ['de'],
    historyLoading = false,
    settingsLoading = false,
    historyError = undefined as unknown,
    settingsError = false,
} = {}) {
    (useHistory as jest.Mock).mockReturnValue({
        orderedTranslations: phrases,
        isLoading: historyLoading,
        isError: historyError,
        refresh: jest.fn(),
    });
    (useSettings as jest.Mock).mockReturnValue({
        userLangs: langs,
        isLoading: settingsLoading,
        hasError: settingsError,
    });
}

async function setup() {
    const rendered = await renderHook(() => useQuiz());
    return rendered.result;
}

const wrongOption = (q: { options: string[]; answer: string }) =>
    q.options.find((o) => o !== q.answer)!;

beforeEach(() => {
    jest.useFakeTimers();
    (correctHaptic as jest.Mock).mockClear();
    (wrongHaptic as jest.Mock).mockClear();
});

afterEach(() => {
    jest.useRealTimers();
});

describe('useQuiz status', () => {
    it('is locked below 8 phrases and reports the progress', async () => {
        mockData({ phrases: makePhrases(MIN_PHRASES - 1) });
        const result = await setup();

        expect(result.current.status).toBe('locked');
        expect(result.current.question).toBeNull();
        expect(result.current.phraseCount).toBe(MIN_PHRASES - 1);
        expect(result.current.minPhrases).toBe(MIN_PHRASES);
    });

    it('is loading while history or settings load', async () => {
        mockData({ historyLoading: true });
        expect((await setup()).current.status).toBe('loading');

        mockData({ settingsLoading: true });
        expect((await setup()).current.status).toBe('loading');
    });

    it('reports an error when history or settings fail to load', async () => {
        mockData({ historyError: new Error('boom') });
        expect((await setup()).current.status).toBe('error');

        mockData({ settingsError: true });
        expect((await setup()).current.status).toBe('error');
    });

    it('is playing with a question once there are 8 phrases', async () => {
        mockData();
        const result = await setup();

        expect(result.current.status).toBe('playing');
        expect(result.current.question?.options).toHaveLength(4);
        expect(result.current.streak).toBe(0);
        expect(result.current.selected).toBeNull();
    });

    it('is unavailable when no question can be built for the selected languages', async () => {
        mockData({ langs: ['fr'] }); // no phrase has a French translation
        const result = await setup();

        expect(result.current.status).toBe('unavailable');
    });
});

describe('useQuiz answering', () => {
    it('increments the streak on a correct answer and shows the selection', async () => {
        mockData();
        const result = await setup();
        const question = result.current.question!;

        await act(async () => result.current.answer(question.answer));

        expect(result.current.selected).toBe(question.answer);
        expect(result.current.streak).toBe(1);
    });

    it('resets the streak on a wrong answer', async () => {
        mockData();
        const result = await setup();

        // Build up a streak of 2 first.
        for (let i = 0; i < 2; i++) {
            await act(async () => result.current.answer(result.current.question!.answer));
            await act(async () => {
                jest.advanceTimersByTime(NEXT_QUESTION_DELAY_MS);
            });
        }
        expect(result.current.streak).toBe(2);

        await act(async () => result.current.answer(wrongOption(result.current.question!)));

        expect(result.current.streak).toBe(0);
    });

    it('gives success haptic feedback for a correct answer and nothing else', async () => {
        mockData();
        const result = await setup();

        await act(async () => result.current.answer(result.current.question!.answer));

        expect(correctHaptic).toHaveBeenCalledTimes(1);
        expect(wrongHaptic).not.toHaveBeenCalled();
    });

    it('gives error haptic feedback for a wrong answer and nothing else', async () => {
        mockData();
        const result = await setup();

        await act(async () => result.current.answer(wrongOption(result.current.question!)));

        expect(wrongHaptic).toHaveBeenCalledTimes(1);
        expect(correctHaptic).not.toHaveBeenCalled();
    });

    it('gives no haptic feedback for ignored taps', async () => {
        mockData();
        const result = await setup();
        const question = result.current.question!;

        await act(async () => result.current.answer(question.answer));
        await act(async () => result.current.answer(wrongOption(question)));

        expect(correctHaptic).toHaveBeenCalledTimes(1);
        expect(wrongHaptic).not.toHaveBeenCalled();
    });

    it('ignores further taps while an answer is showing', async () => {
        mockData();
        const result = await setup();
        const question = result.current.question!;

        await act(async () => result.current.answer(question.answer));
        await act(async () => result.current.answer(wrongOption(question)));

        expect(result.current.selected).toBe(question.answer);
        expect(result.current.streak).toBe(1);
    });

    it('moves to a different question after the delay and clears the selection', async () => {
        mockData();
        const result = await setup();
        const first = result.current.question!;

        await act(async () => result.current.answer(first.answer));
        await act(async () => {
            jest.advanceTimersByTime(NEXT_QUESTION_DELAY_MS - 1);
        });
        expect(result.current.question).toBe(first);

        await act(async () => {
            jest.advanceTimersByTime(1);
        });

        expect(result.current.selected).toBeNull();
        expect(result.current.question).not.toBe(first);
        expect(result.current.question!.phraseId).not.toBe(first.phraseId);
    });

    it('moves on after a wrong answer even at streak 0 (the old hook got stuck here)', async () => {
        mockData();
        const result = await setup();
        const first = result.current.question!;

        await act(async () => result.current.answer(wrongOption(first)));
        await act(async () => {
            jest.advanceTimersByTime(NEXT_QUESTION_DELAY_MS);
        });

        expect(result.current.streak).toBe(0);
        expect(result.current.selected).toBeNull();
        expect(result.current.question!.phraseId).not.toBe(first.phraseId);
    });
});

describe('useQuiz lifecycle', () => {
    it('retries when the user adds a language that makes a question possible', async () => {
        mockData({ langs: ['fr'] }); // nothing is translated into French
        const { result, rerender } = await renderHook(() => useQuiz());
        expect(result.current.status).toBe('unavailable');

        mockData({ langs: ['fr', 'de'] });
        await rerender({});

        expect(result.current.status).toBe('playing');
        expect(result.current.question?.targetLang).toBe('de');
    });

    it('keeps the current question when the same inputs are re-rendered', async () => {
        mockData();
        const { result, rerender } = await renderHook(() => useQuiz());
        const question = result.current.question;

        mockData(); // new array identities, same content
        await rerender({});

        expect(result.current.question).toBe(question);
    });

    it('drops the question and locks again if phrases fall below the minimum', async () => {
        mockData();
        const { result, rerender } = await renderHook(() => useQuiz());
        expect(result.current.status).toBe('playing');

        mockData({ phrases: makePhrases(MIN_PHRASES - 1) });
        await rerender({});

        expect(result.current.status).toBe('locked');
        expect(result.current.question).toBeNull();
    });

    it('does not advance after unmount', async () => {
        mockData();
        const { result, unmount } = await renderHook(() => useQuiz());

        await act(async () => result.current.answer(result.current.question!.answer));
        await unmount();

        expect(() => jest.advanceTimersByTime(NEXT_QUESTION_DELAY_MS)).not.toThrow();
        expect(jest.getTimerCount()).toBe(0);
    });
});
