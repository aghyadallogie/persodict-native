import { ThemeColors, useThemedStyles } from '@/lib/use-themed-styles';
import { StyleSheet, View, ViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export function Screen({ children, style, ...props }: ViewProps) {
    const { styles } = useThemedStyles(createStyles);

    return (
        <SafeAreaView style={styles.container} edges={['bottom']}>
            <View style={[styles.content, style]} {...props}>
                {children}
            </View>
        </SafeAreaView>
    );
}

const createStyles = (colors: ThemeColors) =>
    StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.background },
        content: { flex: 1, paddingHorizontal: 16, paddingTop: 56 },
    });
