import { useHistory } from '@/features/history/use-history';
import { useSettings } from '@/features/settings/use-settings';
import { correctHaptic, wrongHaptic } from '@/lib/haptics';
import { useCallback, useEffect, useRef, useState } from 'react';
import { buildQuestion, MIN_PHRASES, type Question } from './build-question';

/** How long the right/wrong colors stay up before the next question appears. */
export const NEXT_QUESTION_DELAY_MS = 900;

export type QuizStatus =
    /** History or settings are still loading, or the first question isn't dealt yet. */
    | 'loading'
    /** History or settings failed to load. */
    | 'error'
    /** Fewer than MIN_PHRASES phrases in History. */
    | 'locked'
    /** Enough phrases, but no question can be built (e.g. the user's languages lack translations). */
    | 'unavailable'
    | 'playing';

/**
 * State for the quiz screen: an endless run of multiple-choice questions.
 *
 * `answer(option)` locks in the choice (`selected`), bumps or resets `streak`, and deals the
 * next question after NEXT_QUESTION_DELAY_MS. Taps while an answer is showing are ignored.
 */
export function useQuiz() {
    const { orderedTranslations: phrases, isLoading: historyLoading, isError, refresh } =
        useHistory();
    const { userLangs, isLoading: settingsLoading, hasError } = useSettings();

    // `null` = not dealt yet; `{ question: null }` = dealt, but nothing could be built.
    // `key` records which phrases/languages the deal was made for.
    const [deal, setDeal] = useState<{ question: Question | null; key: string } | null>(null);
    const [selected, setSelected] = useState<string | null>(null);
    const [streak, setStreak] = useState(0);
    const nextTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const isLoading = historyLoading || settingsLoading;
    const unlocked = phrases.length >= MIN_PHRASES;
    // Tab screens stay mounted, so the user can change languages or phrases elsewhere and come back.
    const inputsKey = `${phrases.length}|${userLangs.join(',')}`;

    // Deal the first question once data is in. Drop it if the user falls below the minimum
    // (e.g. deleted phrases in History), and retry an "unavailable" deal when the inputs change
    // (e.g. they add a language in Settings). A working question is kept until it's answered.
    //
    // This adjusts state during render (https://react.dev/learn/you-might-not-need-an-effect)
    // instead of in an effect: each branch is guarded so it stops as soon as `deal` matches.
    if (!isLoading) {
        if (!unlocked) {
            if (deal) setDeal(null);
        } else if (!deal || (!deal.question && deal.key !== inputsKey)) {
            setDeal({ question: buildQuestion({ phrases, langs: userLangs }), key: inputsKey });
        }
    }

    useEffect(
        () => () => {
            if (nextTimer.current) clearTimeout(nextTimer.current);
        },
        []
    );

    const question = deal?.question ?? null;

    const answer = useCallback(
        (option: string) => {
            if (!question || selected !== null) return;

            const correct = option === question.answer;
            setSelected(option);
            setStreak((current) => (correct ? current + 1 : 0));
            if (correct) correctHaptic();
            else wrongHaptic();

            nextTimer.current = setTimeout(() => {
                setSelected(null);
                setDeal({
                    question: buildQuestion({
                        phrases,
                        langs: userLangs,
                        excludeId: question.phraseId,
                    }),
                    key: inputsKey,
                });
            }, NEXT_QUESTION_DELAY_MS);
        },
        [question, selected, phrases, userLangs, inputsKey]
    );

    let status: QuizStatus;
    if (isError || hasError) status = 'error';
    else if (isLoading) status = 'loading';
    else if (!unlocked) status = 'locked';
    else if (!deal) status = 'loading';
    else status = question ? 'playing' : 'unavailable';

    return {
        status,
        question,
        selected,
        streak,
        answer,
        phraseCount: phrases.length,
        minPhrases: MIN_PHRASES,
        retry: refresh,
    };
}
