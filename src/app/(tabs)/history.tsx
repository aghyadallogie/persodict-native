import { NoWords } from '@/components/history/no-words';
import { PhraseView } from '@/components/history/phrase-view';
import { Screen } from '@/components/ui/screen';
import { useHistory } from '@/features/history/use-history';
import { useTheme } from '@/lib/theme';
import { ActivityIndicator, FlatList, Text } from 'react-native';

export default function HistoryScreen() {
  const { colors } = useTheme();
  const { orderedTranslations, isLoading, isError, refresh } = useHistory();

  if (isLoading) {
    return (
      <Screen style={{ justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={colors.primary} />
      </Screen>
    );
  }

  if (isError) {
    return (
      <Screen style={{ justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: colors.text, marginBottom: 12 }}>
          Failed to load history
        </Text>
        <Text onPress={() => refresh()} style={{ color: colors.primary }}>
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
    <Screen style={{ padding: 0 }}>
      <FlatList
        data={orderedTranslations}
        keyExtractor={(p) => p.id}
        renderItem={({ item }) => <PhraseView phrase={item} />}
        contentContainerStyle={{ padding: 16, gap: 22 }}
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={5}
      />
    </Screen>
  );
}