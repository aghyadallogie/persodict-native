import { TranslatedPhrase } from '@/components/translate/translated-phrase';
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
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import useSWR from 'swr';

export default function HomeScreen() {
  const { colors } = useTheme();
  const { handleSubmit, isLoading, error, result, clearResult } = useSubmitTranslate();
  const [text, setText] = useState('');

  const { data: phrases, isValidating } = useSWR('phrases', () => historyRepository.listHistory());

  useEffect(() => {
    if (!result || !phrases || isValidating) return;
    if (!phrases.some((p) => p.id === result.id)) {
      clearResult();
    }
  }, [phrases, result, isValidating, clearResult]);

  const onSubmit = async () => {
    if (!text.trim() || isLoading) return;
    await handleSubmit(text);
    setText('');
  };

  const canSubmit = text.trim().length > 0 && !isLoading;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <Screen>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 32 }}
        >
          <View style={styles.form}>
            <TextInput
              value={text}
              onChangeText={(t) => {
                setText(t);
                if (result || error) clearResult();
              }}
              placeholder="Word to translate"
              placeholderTextColor={colors.textMuted}
              style={[
                styles.input,
                {
                  borderColor: colors.border,
                  color: colors.text,
                  boxShadow: `0px 2px 8px ${colors.shadow}`,
                },
              ]}
              editable={!isLoading}
              onSubmitEditing={onSubmit}
              returnKeyType="go"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Pressable
              onPress={onSubmit}
              disabled={!canSubmit}
              style={[
                styles.button,
                { backgroundColor: colors.primary, opacity: canSubmit ? 1 : 0.5 },
              ]}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Ionicons name="language" size={22} color="#fff" />
              )}
            </Pressable>
          </View>

          {error && (
            <Text style={styles.error} accessibilityRole="alert">
              {error}
            </Text>
          )}

          {result && <TranslatedPhrase phrase={result} />}
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
  button: {
    width: 52,
    height: 52,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  error: {
    color: '#DC2626',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 12,
  },
});