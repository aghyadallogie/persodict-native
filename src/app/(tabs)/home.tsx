import { PhraseView } from '@/components/history/phrase-view';
import { EmptyTranslate } from '@/components/translate/empty-translate';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Screen } from '@/components/ui/screen';
import { historyRepository } from '@/features/history';
import { useSettings } from '@/features/settings/use-settings';
import { useSubmitTranslate } from '@/features/translate/use-translate';
import { ThemeColors, useThemedStyles } from '@/lib/use-themed-styles';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import useSWR from 'swr';

export default function HomeScreen() {
  const { styles, colors } = useThemedStyles(createStyles);
  const { handleSubmit, isLoading, error, result, clearResult } = useSubmitTranslate();
  const [text, setText] = useState('');
  const { userLangs, isLoading: settingsLoading } = useSettings();

  const { data: phrases, isLoading: phrasesLoading } = useSWR('phrases', () =>
    historyRepository.listHistory()
  );

  const ordered = phrases ? [...phrases].reverse() : [];
  const latest = ordered[0] ?? null;
  const shown = result ?? latest;
  const canSubmit = text.trim().length > 0 && !isLoading;

  // Empty state needs the language settings too, so keep the spinner up until both are in.
  const showEmpty = !shown && !!phrases && phrases.length === 0 && !settingsLoading;
  const showLoading = !shown && !showEmpty && (phrasesLoading || settingsLoading);

  useEffect(() => {
    if (phrasesLoading || !phrases || !result) return;
    if (!phrases.some((p) => p.id === result.id)) {
      clearResult();
    }
  }, [phrases, phrasesLoading, result, clearResult]);

  const onSubmit = async () => {
    if (!text.trim() || isLoading) return;
    await handleSubmit(text);
    setText('');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.flex}
    >
      <Screen>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scroll}
        >
          <View style={styles.form}>
            <Input
              value={text}
              onChangeText={(t) => {
                setText(t);
                if (error) clearResult();
              }}
              placeholder="Text to translate"
              style={styles.input}
              editable={!isLoading}
              onSubmitEditing={onSubmit}
              returnKeyType="go"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Button
              onPress={onSubmit}
              disabled={!canSubmit}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.text} />
              ) : (
                <Ionicons name="language" size={24} color={colors.text} />
              )}
            </Button>
          </View>

          {error && (
            <Text style={styles.error} accessibilityRole="alert">
              {error}
            </Text>
          )}

          {shown && (
            <View style={styles.result}>
              <PhraseView key={shown.id} phrase={shown} waitForExit />
            </View>
          )}

          {showLoading && (
            <View style={styles.loading}>
              <ActivityIndicator color={colors.primary} />
            </View>
          )}

          {showEmpty && <EmptyTranslate userLangs={userLangs} />}
        </ScrollView>
      </Screen>
    </KeyboardAvoidingView>
  );
}

const createStyles = (_colors: ThemeColors) =>
  StyleSheet.create({
    flex: { flex: 1 },
    scroll: { paddingBottom: 32, paddingHorizontal: 12 },
    form: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 24,
      alignItems: 'center',
    },
    input: {
      flex: 1,
    },
    error: {
      color: '#DC2626',
      fontSize: 13,
      textAlign: 'center',
      marginTop: 12,
    },
    result: {
      marginTop: 20,
    },
    loading: {
      marginTop: 40,
      alignItems: 'center',
    },
  });