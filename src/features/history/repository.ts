import type { Phrase } from './types';

export interface HistoryRepository {
    listHistory(): Promise<Phrase[]>;
}