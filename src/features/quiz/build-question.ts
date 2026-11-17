import type { Phrase } from '@/features/history/types';

/** A user needs at least this many phrases in History to play. */
export const MIN_PHRASES = 8;
/** Options shown per question: the answer plus OPTION_COUNT - 1 distractors. */
export const OPTION_COUNT = 4;
/** Every phrase is translated from English, which is what the quiz shows as the prompt. */
export const PROMPT_LANG = 'en';

export type Question = {
    phraseId: string;
    promptLang: string;
    /** The word shown to the user (in `promptLang`). */
    prompt: string;
    /** The language the options are in. */
    targetLang: string;
    answer: string;
    /** `OPTION_COUNT` unique strings in random order, one of which is `answer`. */
    options: string[];
};

type BuildArgs = {
    phrases: Phrase[];
    /** The user's selected languages; the question's target language is one of these. */
    langs: string[];
    promptLang?: string;
    /** A phrase to skip, so the same word doesn't come up twice in a row. */
    excludeId?: string;
    /** Injectable for tests. */
    rng?: () => number;
};

const textOf = (phrase: Phrase, lang: string): string | null =>
    phrase.translations[lang]?.trim() || null;

/** Fisher-Yates; returns a new array. */
export function shuffle<T>(items: readonly T[], rng: () => number = Math.random): T[] {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}

/**
 * Builds one multiple-choice question: a random phrase's `promptLang` text, with its
 * translation in a random target language among 3 random, distinct wrong answers.
 *
 * Languages are tried in random order, so a language that a phrase (or too many phrases)
 * lack a translation for is skipped instead of producing a broken question. Returns
 * `null` when no valid question can be built at all.
 */
export function buildQuestion({
    phrases,
    langs,
    promptLang = PROMPT_LANG,
    excludeId,
    rng = Math.random,
}: BuildArgs): Question | null {
    const targetLangs = shuffle(
        langs.filter((lang) => lang !== promptLang),
        rng
    );

    for (const targetLang of targetLangs) {
        const candidates = phrases.filter(
            (p) => p.id !== excludeId && textOf(p, promptLang) && textOf(p, targetLang)
        );
        if (!candidates.length) continue;

        const phrase = candidates[Math.floor(rng() * candidates.length)];
        const answer = textOf(phrase, targetLang)!;

        const wrongAnswers = new Set<string>();
        for (const other of phrases) {
            const text = textOf(other, targetLang);
            if (other.id !== phrase.id && text && text !== answer) wrongAnswers.add(text);
        }
        if (wrongAnswers.size < OPTION_COUNT - 1) continue;

        const distractors = shuffle([...wrongAnswers], rng).slice(0, OPTION_COUNT - 1);

        return {
            phraseId: phrase.id,
            promptLang,
            prompt: textOf(phrase, promptLang)!,
            targetLang,
            answer,
            options: shuffle([answer, ...distractors], rng),
        };
    }

    return null;
}
