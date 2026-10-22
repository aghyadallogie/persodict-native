// Mirrors Phrase from the NestJS phrase.model.ts
export type Phrase = {
    id: string;
    authorId: string;
    translations: Record<string, string>;
};