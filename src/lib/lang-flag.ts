// ISO 639-1 language code → emoji flag
const FLAGS: Record<string, string> = {
    en: '🇬🇧',
    ar: '🇸🇦',
    fr: '🇫🇷',
    es: '🇪🇸',
    de: '🇩🇪',
    it: '🇮🇹',
    pt: '🇵🇹',
    ru: '🇷🇺',
    zh: '🇨🇳',
    ja: '🇯🇵',
    ko: '🇰🇷',
    tr: '🇹🇷',
    nl: '🇳🇱',
    sv: '🇸🇪',
    pl: '🇵🇱',
    hi: '🇮🇳',
};

export function flagFor(lang: string): string {
    return FLAGS[lang.toLowerCase()] ?? '🏳️';
}