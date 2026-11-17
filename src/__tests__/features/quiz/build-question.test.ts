import type { Phrase } from '@/features/history/types';
import { buildQuestion, OPTION_COUNT, shuffle } from '@/features/quiz/build-question';

const phrase = (id: string, translations: Record<string, string>): Phrase => ({
    id,
    authorId: 'u1',
    translations,
});

/** 8 phrases, each translated into German and French. */
const phrases: Phrase[] = ['apple', 'house', 'water', 'book', 'tree', 'dog', 'sun', 'moon'].map(
    (en, i) => phrase(String(i + 1), { en, de: `de-${en}`, fr: `fr-${en}` })
);

describe('buildQuestion', () => {
    it('builds a question with the answer and 3 distinct wrong options', () => {
        const q = buildQuestion({ phrases, langs: ['de'] })!;

        expect(q).not.toBeNull();
        expect(q.options).toHaveLength(OPTION_COUNT);
        expect(new Set(q.options).size).toBe(OPTION_COUNT);
        expect(q.options).toContain(q.answer);
    });

    it('shows the English word and asks for its translation in the target language', () => {
        const q = buildQuestion({ phrases, langs: ['de'] })!;
        const source = phrases.find((p) => p.id === q.phraseId)!;

        expect(q.promptLang).toBe('en');
        expect(q.prompt).toBe(source.translations.en);
        expect(q.targetLang).toBe('de');
        expect(q.answer).toBe(source.translations.de);
        expect(q.options.every((o) => o.startsWith('de-'))).toBe(true);
    });

    it('only uses the languages the user selected', () => {
        for (let i = 0; i < 30; i++) {
            const q = buildQuestion({ phrases, langs: ['de', 'fr'] })!;
            expect(['de', 'fr']).toContain(q.targetLang);
        }
    });

    it('never picks the prompt language as the target', () => {
        for (let i = 0; i < 20; i++) {
            const q = buildQuestion({ phrases, langs: ['en', 'de'] })!;
            expect(q.targetLang).toBe('de');
        }
    });

    it('never asks about the excluded phrase', () => {
        for (let i = 0; i < 50; i++) {
            const q = buildQuestion({ phrases, langs: ['de'], excludeId: '3' })!;
            expect(q.phraseId).not.toBe('3');
        }
    });

    it('varies the wrong answers instead of always taking the first few', () => {
        const seen = new Set<string>();
        for (let i = 0; i < 100; i++) {
            const q = buildQuestion({ phrases, langs: ['de'] })!;
            q.options.filter((o) => o !== q.answer).forEach((o) => seen.add(o));
        }
        // 8 phrases -> 8 possible options; a "first 3 others" bug would stay far below this.
        expect(seen.size).toBeGreaterThan(5);
    });

    it('is deterministic for a given rng', () => {
        const seeded = () => {
            let n = 0;
            return () => ((n = (n * 9301 + 49297) % 233280) + 0.5) / 233280;
        };

        expect(buildQuestion({ phrases, langs: ['de', 'fr'], rng: seeded() })).toEqual(
            buildQuestion({ phrases, langs: ['de', 'fr'], rng: seeded() })
        );
    });

    it('only asks about phrases that have both the prompt and the target text', () => {
        const mixed = [
            ...phrases.slice(0, 4),
            phrase('x1', { de: 'de-no-english' }),
            phrase('x2', { en: 'no german' }),
            phrase('x3', { en: 'blank', de: '   ' }),
        ];

        for (let i = 0; i < 50; i++) {
            const q = buildQuestion({ phrases: mixed, langs: ['de'] })!;
            expect(['1', '2', '3', '4']).toContain(q.phraseId);
        }
    });

    it('never offers a blank option, but may use a phrase without a prompt as a wrong answer', () => {
        const mixed = [
            ...phrases.slice(0, 3),
            phrase('x1', { de: 'de-no-english' }),
            phrase('x3', { en: 'blank', de: '   ' }),
        ];

        for (let i = 0; i < 30; i++) {
            const q = buildQuestion({ phrases: mixed, langs: ['de'] })!;
            expect(q.options).toHaveLength(OPTION_COUNT);
            expect(q.options.every((o) => o.trim() !== '')).toBe(true);
            // Only 3 complete phrases + 1 extra German word exist, so the extra word must appear.
            expect(q.options).toContain('de-no-english');
        }
    });

    it('skips a language that is missing translations and falls back to another', () => {
        // Only French is complete for these 4 phrases; Spanish exists on one phrase only.
        const partial = phrases
            .slice(0, 4)
            .map((p, i) => (i === 0 ? { ...p, translations: { ...p.translations, es: 'es-x' } } : p));

        for (let i = 0; i < 30; i++) {
            const q = buildQuestion({ phrases: partial, langs: ['es', 'fr'] })!;
            expect(q.targetLang).toBe('fr');
        }
    });

    it('does not offer duplicate options when two phrases share a translation', () => {
        const dupes = [
            phrase('1', { en: 'a', de: 'gleich' }),
            phrase('2', { en: 'b', de: 'gleich' }),
            phrase('3', { en: 'c', de: 'eins' }),
            phrase('4', { en: 'd', de: 'zwei' }),
            phrase('5', { en: 'e', de: 'drei' }),
        ];

        for (let i = 0; i < 50; i++) {
            const q = buildQuestion({ phrases: dupes, langs: ['de'] })!;
            expect(new Set(q.options).size).toBe(OPTION_COUNT);
        }
    });

    it('returns null when there are not enough distinct translations for 4 options', () => {
        const three = phrases.slice(0, 3);
        const sameTranslation = phrases.slice(0, 5).map((p) => ({
            ...p,
            translations: { ...p.translations, de: 'same' },
        }));

        expect(buildQuestion({ phrases: three, langs: ['de'] })).toBeNull();
        expect(buildQuestion({ phrases: sameTranslation, langs: ['de'] })).toBeNull();
    });

    it('returns null without languages or phrases', () => {
        expect(buildQuestion({ phrases, langs: [] })).toBeNull();
        expect(buildQuestion({ phrases: [], langs: ['de'] })).toBeNull();
    });
});

describe('shuffle', () => {
    it('returns a permutation without mutating the input', () => {
        const input = [1, 2, 3, 4, 5, 6];
        const copy = [...input];

        const result = shuffle(input);

        expect(input).toEqual(copy);
        expect([...result].sort()).toEqual(copy);
    });
});
