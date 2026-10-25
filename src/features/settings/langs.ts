export const langs = [
    { code: 'de' },
    { code: 'fr' },
    { code: 'it' },
    { code: 'es' },
    { code: 'sv' },
    { code: 'bg' },
    { code: 'pt' },
    { code: 'ru' },
    { code: 'tr' },
    { code: 'hu' },
    { code: 'el' },
    { code: 'pl' },
    { code: 'nl' },
    { code: 'ar' },
    { code: 'ja' },
] as const;

export type LangCode = (typeof langs)[number]['code'];