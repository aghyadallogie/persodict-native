import { ApiHistoryRepository } from '@/features/history/api-repository';
import { apiFetch, AuthError } from '@/lib/api';

jest.mock('@/lib/api', () => ({
    ...jest.requireActual('@/lib/api'),
    apiFetch: jest.fn(),
}));

const apiFetchMock = apiFetch as jest.Mock;

const phrases = [
    { id: '1', authorId: 'u1', translations: { de: 'Hallo' } },
    { id: '2', authorId: 'u1', translations: { de: 'Welt' } },
];

const ok = () => ({ ok: true, status: 200, json: async () => phrases });
const serverError = () => ({ ok: false, status: 503, statusText: 'Unavailable' });

beforeEach(() => {
    jest.useFakeTimers();
    apiFetchMock.mockReset();
});

afterEach(() => {
    jest.useRealTimers();
});

describe('ApiHistoryRepository.listHistory', () => {
    const repo = new ApiHistoryRepository();

    it('returns the phrase list on success without retrying', async () => {
        apiFetchMock.mockResolvedValue(ok());

        await expect(repo.listHistory()).resolves.toEqual(phrases);
        expect(apiFetchMock).toHaveBeenCalledTimes(1);
        expect(apiFetchMock).toHaveBeenCalledWith('/phrases');
    });

    it('retries transient failures and succeeds on a later attempt', async () => {
        apiFetchMock
            .mockResolvedValueOnce(serverError())
            .mockRejectedValueOnce(new TypeError('Network request failed'))
            .mockResolvedValueOnce(ok());

        const result = repo.listHistory();
        await jest.runAllTimersAsync();

        await expect(result).resolves.toEqual(phrases);
        expect(apiFetchMock).toHaveBeenCalledTimes(3);
    });

    it('gives up after 3 attempts and throws the last error', async () => {
        apiFetchMock.mockResolvedValue(serverError());

        const result = repo.listHistory();
        const assertion = expect(result).rejects.toThrow('Failed to fetch phrases: 503 Unavailable');
        await jest.runAllTimersAsync();

        await assertion;
        expect(apiFetchMock).toHaveBeenCalledTimes(3);
    });

    it('does not retry auth failures', async () => {
        apiFetchMock.mockRejectedValue(new AuthError());

        await expect(repo.listHistory()).rejects.toBeInstanceOf(AuthError);
        expect(apiFetchMock).toHaveBeenCalledTimes(1);
    });
});
