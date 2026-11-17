import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * Haptics are decoration: fire and forget, and never let a failure (unsupported device, Low
 * Power Mode, missing native module) surface as an error in the UI.
 */
function fire(run: () => Promise<void>) {
    try {
        run().catch(() => {});
    } catch {
        // ignore
    }
}

/** A short "yes": Android's Confirm effect (needs no VIBRATE permission), iOS success. */
export function correctHaptic() {
    fire(() =>
        Platform.OS === 'android'
            ? Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Confirm)
            : Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    );
}

/** A short "no": Android's Reject effect, iOS error. */
export function wrongHaptic() {
    fire(() =>
        Platform.OS === 'android'
            ? Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Reject)
            : Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
    );
}
