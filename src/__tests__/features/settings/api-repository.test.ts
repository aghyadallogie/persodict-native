import { fetchSettings, saveSettings } from '@/features/settings/api-repository';
import { apiFetch, AuthError } from '@/lib/api';

jest.mock('@/lib/api', () => ({
    ...jest.requireActual('@/lib/api'),
    apiFetch: jest.fn(),
}));

const apiFetchMock = apiFetch as jest.Mock;

function jsonResponse(status: number, body?: unknown) {
    return {
        status,
        ok: status >= 200 && status < 300,
        json: async () => body,
    };
}

const settings = { userId: 'u1', userLangs: ['de', 'fr'] };

beforeEach(() => {
    apiFetchMock.mockReset();
});

describe('fetchSettings', () => {
    it('returns a bare settings object as-is', async () => {
        apiFetchMock.mockResolvedValue(jsonResponse(200, settings));

        await expect(fetchSettings()).resolves.toEqual(settings);
        expect(apiFetchMock).toHaveBeenCalledWith('/settings');
    });

    it('unwraps the { data } envelope', async () => {
        apiFetchMock.mockResolvedValue(jsonResponse(200, { data: settings }));

        await expect(fetchSettings()).resolves.toEqual(settings);
    });

    it('treats a 404 as a new user with no languages yet', async () => {
        apiFetchMock.mockResolvedValue(jsonResponse(404));

        await expect(fetchSettings()).resolves.toEqual({ userId: '', userLangs: [] });
    });

    it('throws on other error statuses', async () => {
        apiFetchMock.mockResolvedValue(jsonResponse(500));

        await expect(fetchSettings()).rejects.toThrow('Failed to load settings: 500');
    });

    it('lets AuthError through so the hook can sign out', async () => {
        apiFetchMock.mockRejectedValue(new AuthError());

        await expect(fetchSettings()).rejects.toBeInstanceOf(AuthError);
    });
});

describe('saveSettings', () => {
    it('POSTs userId and userLangs and returns the saved settings', async () => {
        apiFetchMock.mockResolvedValue(jsonResponse(201, { data: settings }));

        await expect(saveSettings('u1', ['de', 'fr'])).resolves.toEqual(settings);

        const [path, init] = apiFetchMock.mock.calls[0];
        expect(path).toBe('/settings');
        expect(init.method).toBe('POST');
        expect(JSON.parse(init.body)).toEqual({ userId: 'u1', userLangs: ['de', 'fr'] });
    });

    it('throws when the server rejects the save', async () => {
        apiFetchMock.mockResolvedValue(jsonResponse(400));

        await expect(saveSettings('u1', [])).rejects.toThrow('Failed to save settings: 400');
    });
});
