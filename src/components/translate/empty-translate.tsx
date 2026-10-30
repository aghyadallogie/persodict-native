import { Button } from '@/components/ui/button';
import { flagFor } from '@/lib/lang-flag';
import { useThemedStyles } from '@/lib/use-themed-styles';
import { router } from 'expo-router';
import { Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

const STEPS = [
    'Input text to translate',
    'Tap the translate button',
    'Find it again anytime in History',
    'Make 8 translations to play the quiz!'
];

export function EmptyTranslate({ userLangs }: { userLangs: string[] }) {
    const { styles } = useThemedStyles(createStyles);
    const hasLangs = userLangs.length > 0;

    return (
        <Animated.View entering={FadeInDown.duration(400)} style={styles.container}>
            {hasLangs ? (
                <View style={styles.card}>
                    <Text style={styles.cardLabel}>You'll get translations in</Text>
                    <View style={styles.flags}>
                        {userLangs.map((code) => (
                            <Text key={code} style={styles.flag}>
                                {flagFor(code)}
                            </Text>
                        ))}
                    </View>
                    <Text style={styles.link} onPress={() => router.navigate('/settings')}>
                        Change languages
                    </Text>
                </View>
            ) : (
                <View style={styles.card}>
                    <Text style={styles.cardLabel}>One thing first</Text>
                    <Text style={styles.cardBody}>
                        Pick at least one language so we know what to translate into.
                    </Text>
                    <Button
                        width={220}
                        onPress={() => router.navigate('/settings')}
                        style={styles.cta}
                    >
                        Choose languages
                    </Button>
                </View>
            )}

            <View style={styles.steps}>
                {STEPS.map((step, i) => (
                    <View key={step} style={styles.step}>
                        <View style={styles.stepBadge}>
                            <Text style={styles.stepNumber}>{i + 1}</Text>
                        </View>
                        <Text style={styles.stepText}>{step}</Text>
                    </View>
                ))}
            </View>
        </Animated.View>
    );
}

type Colors = Parameters<Parameters<typeof useThemedStyles>[0]>[0];

const createStyles = (colors: Colors) => ({
    container: {
        alignItems: 'center' as const,
        marginTop: 40,
        paddingHorizontal: 8,
    },
    card: {
        width: '100%' as const,
        alignItems: 'center' as const,
        borderWidth: 1,
        borderRadius: 10,
        borderColor: colors.border,
        paddingVertical: 16,
        paddingHorizontal: 16,
        gap: 10,
        boxShadow: `0px 2px 8px ${colors.shadow}`,
    },
    cardLabel: {
        color: colors.text,
        fontSize: 13,
        fontWeight: '600' as const,
        textTransform: 'uppercase' as const,
        letterSpacing: 1,
    },
    cardBody: {
        color: colors.textMuted,
        fontSize: 15,
        textAlign: 'center' as const,
    },
    flags: {
        flexDirection: 'row' as const,
        flexWrap: 'wrap' as const,
        justifyContent: 'center' as const,
        gap: 10,
    },
    flag: { fontSize: 28 },
    link: {
        color: colors.primary,
        fontSize: 14,
        fontWeight: '600' as const,
    },
    cta: { marginTop: 4 },
    steps: {
        width: '100%' as const,
        marginTop: 38,
        gap: 14,
    },
    step: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        gap: 14,
    },
    stepBadge: {
        width: 28,
        height: 28,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: colors.primary,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
    },
    stepNumber: {
        color: colors.primary,
        fontSize: 13,
        fontWeight: '700' as const,
    },
    stepText: {
        color: colors.text,
        fontSize: 15,
        flex: 1,
    },
});
