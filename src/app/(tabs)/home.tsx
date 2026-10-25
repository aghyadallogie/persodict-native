import { TranslatedPhrase } from '@/components/translate/translated-phrase';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { historyRepository } from '@/features/history';
import { useSubmitTranslate } from '@/features/translate/use-translate';
import { useTheme } from '@/lib/theme';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import useSWR from 'swr';

export default function HomeScreen() {
  const { colors } = useTheme();
  const { handleSubmit, isLoading, error, result, clearResult } = useSubmitTranslate();
  const [text, setText] = useState('');

  const { data: phrases, isLoading: phrasesLoading } = useSWR('phrases', () =>
    historyRepository.listHistory()
  );

  const ordered = phrases ? [...phrases].reverse() : [];
  const latest = ordered[0] ?? null;
  const shown = result ?? latest;
  const canSubmit = text.trim().length > 0 && !isLoading;

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
      style={{ flex: 1 }}
    >
      <Screen>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 32, paddingHorizontal: 12 }}
        >
          <View style={styles.form}>
            <TextInput
              value={text}
              onChangeText={(t) => {
                setText(t);
                if (error) clearResult();
              }}
              placeholder="Text to translate"
              placeholderTextColor={colors.textMuted}
              style={[
                styles.input,
                {
                  borderColor: colors.border,
                  color: colors.text,
                  boxShadow: `0px 2px 8px ${colors.shadow}`,
                  borderTopColor: colors.shadow,
                  borderLeftColor: colors.shadow,
                  borderRightColor: colors.border,
                  borderBottomColor: colors.border,
                  backgroundColor: colors.inputBackground,
                },
              ]}
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
                <ActivityIndicator color="#fff" />
              ) : (
                <Ionicons name="language" size={22} color="#fff" />
              )}
            </Button>
          </View>

          {error && (
            <Text style={styles.error} accessibilityRole="alert">
              {error}
            </Text>
          )}

          {shown && (
            <TranslatedPhrase phrase={shown} />
          )}

          {!shown && phrases && phrases.length === 0 && (
            <Text>
              Translate something to get started.
            </Text>
          )}
        </ScrollView>
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  form: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 15,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  error: {
    color: '#DC2626',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 12,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    textAlign: 'center',
    marginTop: 24,
    marginBottom: 8,
  },
});