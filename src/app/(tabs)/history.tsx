import { NoWords } from '@/components/history/no-words';
import { PhraseView } from '@/components/history/phrase-view';
import { Screen } from '@/components/ui/screen';
import { useHistory } from '@/features/history/use-history';
import { ThemeColors, useThemedStyles } from '@/lib/use-themed-styles';
import { ActivityIndicator, StyleSheet, Text } from 'react-native';
import Animated, { LinearTransition } from 'react-native-reanimated';

export default function HistoryScreen() {
  const { styles, colors } = useThemedStyles(createStyles);
  const { orderedTranslations, isLoading, isError, refresh } = useHistory();

  if (isLoading) {
    return (
      <Screen style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </Screen>
    );
  }

  if (isError) {
    return (
      <Screen style={styles.center}>
        <Text style={styles.errorTitle}>Failed to load history</Text>
        <Text onPress={() => refresh()} style={styles.retry}>
          Retry
        </Text>
      </Screen>
    );
  }

  if (!orderedTranslations.length) {
    return (
      <Screen>
        <NoWords error={null} />
      </Screen>
    );
  }

  return (
    <Screen style={styles.list}>
      <Animated.FlatList
        data={orderedTranslations}
        itemLayoutAnimation={LinearTransition.duration(250)}
        keyExtractor={(p) => p.id}
        renderItem={({ item }) => <PhraseView phrase={item} />}
        contentContainerStyle={styles.listContent}
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={5}
      />
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    center: { justifyContent: 'center', alignItems: 'center' },
    errorTitle: { color: colors.text, marginBottom: 12 },
    retry: { color: colors.primary },
    list: { padding: 0 },
    listContent: { padding: 16, gap: 22 },
  });
