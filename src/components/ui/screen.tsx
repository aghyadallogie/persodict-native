import { useTheme } from '@/lib/theme';
import { StyleSheet, View, ViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export function Screen({ children, style, ...props }: ViewProps) {
    const { colors } = useTheme();

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
            <View style={[styles.content, style]} {...props}>
                {children}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { flex: 1, paddingHorizontal: 16, paddingTop: 56 },
});