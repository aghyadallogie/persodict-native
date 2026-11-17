import { correctHaptic, wrongHaptic } from '@/lib/haptics';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

jest.mock('expo-haptics', () => ({
    notificationAsync: jest.fn(() => Promise.resolve()),
    performAndroidHapticsAsync: jest.fn(() => Promise.resolve()),
    NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
    AndroidHaptics: { Confirm: 'Confirm', Reject: 'Reject' },
}));

const notification = Haptics.notificationAsync as jest.Mock;
const android = Haptics.performAndroidHapticsAsync as jest.Mock;

beforeEach(() => {
    notification.mockClear();
    android.mockClear();
});

afterEach(() => {
    jest.restoreAllMocks();
});

describe('haptics on iOS', () => {
    beforeEach(() => {
        jest.replaceProperty(Platform, 'OS', 'ios');
    });

    it('uses the success notification for a correct answer', () => {
        correctHaptic();

        expect(notification).toHaveBeenCalledWith('success');
        expect(android).not.toHaveBeenCalled();
    });

    it('uses the error notification for a wrong answer', () => {
        wrongHaptic();

        expect(notification).toHaveBeenCalledWith('error');
        expect(android).not.toHaveBeenCalled();
    });
});

describe('haptics on Android', () => {
    beforeEach(() => {
        jest.replaceProperty(Platform, 'OS', 'android');
    });

    it('uses the Confirm effect for a correct answer', () => {
        correctHaptic();

        expect(android).toHaveBeenCalledWith('Confirm');
        expect(notification).not.toHaveBeenCalled();
    });

    it('uses the Reject effect for a wrong answer', () => {
        wrongHaptic();

        expect(android).toHaveBeenCalledWith('Reject');
        expect(notification).not.toHaveBeenCalled();
    });
});

describe('haptics failures', () => {
    beforeEach(() => {
        jest.replaceProperty(Platform, 'OS', 'ios');
    });

    it('swallows a rejected haptic call', async () => {
        notification.mockReturnValueOnce(Promise.reject(new Error('Taptic Engine unavailable')));

        expect(() => correctHaptic()).not.toThrow();
        await Promise.resolve(); // let the rejection settle; an unhandled one would fail the test
    });

    it('swallows a haptic call that throws synchronously', () => {
        notification.mockImplementationOnce(() => {
            throw new Error('native module missing');
        });

        expect(() => wrongHaptic()).not.toThrow();
    });
});
