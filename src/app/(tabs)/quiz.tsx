import { OptionButton, type OptionState } from '@/components/quiz/option-button';
import { QuizLocked } from '@/components/quiz/quiz-locked';
import { StreakCounter } from '@/components/quiz/streak-counter';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import type { Question } from '@/features/quiz/build-question';
import { useQuiz } from '@/features/quiz/use-quiz';
import { flagFor } from '@/lib/lang-flag';
import { ThemeColors, useThemedStyles } from '@/lib/use-themed-styles';
import { router } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

const ENTER_MS = 260;
/** Delay between each option appearing, so they cascade in. */
const STAGGER_MS = 70;

function optionState(option: string, question: Question, selected: string | null): OptionState {
  if (selected === null) return 'idle';
  if (option === question.answer) return 'correct';
  if (option === selected) return 'wrong';
  return 'dimmed';
}

export default function QuizScreen() {
  const { styles, colors } = useThemedStyles(createStyles);
  const { status, question, selected, streak, answer, phraseCount, minPhrases, retry } = useQuiz();

  if (status === 'loading') {
    return (
      <Screen style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </Screen>
    );
  }

  if (status === 'error') {
    return (
      <Screen style={styles.center}>
        <Text style={styles.message}>Failed to load your quiz</Text>
        <Text onPress={() => retry()} style={styles.link} accessibilityRole="link">
          Retry
        </Text>
      </Screen>
    );
  }

  if (status === 'locked') {
    return (
      <Screen>
        <QuizLocked count={phraseCount} min={minPhrases} />
      </Screen>
    );
  }

  if (status === 'unavailable' || !question) {
    return (
      <Screen style={styles.center}>
        <Text style={styles.title}>No quiz yet</Text>
        <Text style={styles.message}>
          Not enough of your phrases are translated into your selected languages. Pick more
          languages, then translate a few more phrases.
        </Text>
        <Button width={220} onPress={() => router.navigate('/settings')}>
          Choose languages
        </Button>
      </Screen>
    );
  }

  // New key per question: the prompt and options remount, which replays their entrance.
  const questionKey = `${question.phraseId}:${question.targetLang}`;

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.question}>
          <Animated.View
            key={questionKey}
            entering={FadeInDown.duration(ENTER_MS)}
            style={styles.prompt}
          >
            <View style={styles.promptLabelRow}>
              <Text style={styles.promptLabel}>Translate to</Text>
              <Text style={styles.flag}>{flagFor(question.targetLang)}</Text>
            </View>
            <Text
              style={styles.promptText}
              numberOfLines={2}
              adjustsFontSizeToFit
              minimumFontScale={0.5}
            >
              {question.prompt}
            </Text>
          </Animated.View>

          <View style={styles.options}>
            {question.options.map((option, index) => (
              <Animated.View
                key={`${questionKey}:${option}`}
                entering={FadeInDown.delay(ENTER_MS / 2 + index * STAGGER_MS).duration(ENTER_MS)}
              >
                <OptionButton
                  label={option}
                  state={optionState(option, question, selected)}
                  disabled={selected !== null}
                  onPress={() => answer(option)}
                />
              </Animated.View>
            ))}
          </View>
        </View>

        <StreakCounter streak={streak} />
      </ScrollView>
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    center: { justifyContent: 'center', alignItems: 'center', gap: 12 },
    title: { color: colors.text, fontSize: 22, fontWeight: '600' },
    message: { color: colors.textMuted, fontSize: 15, textAlign: 'center' },
    link: { color: colors.primary },
    // Fills the screen so the streak sits at the bottom; scrolls only on very short screens.
    // Side padding keeps the options off the screen edges.
    scroll: {
      flexGrow: 1,
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingBottom: 24,
      gap: 24,
    },
    question: { gap: 32 },
    // Fixed heights below: the prompt and options keep their size and position whatever the
    // text length (long text shrinks / truncates instead of pushing things around).
    prompt: { alignItems: 'center', gap: 12 },
    promptLabelRow: { height: 36, flexDirection: 'row', alignItems: 'center', gap: 8 },
    promptLabel: { color: colors.textMuted, fontSize: 15 },
    flag: { fontSize: 26, lineHeight: 34 },
    promptText: {
      height: 88,
      color: colors.text,
      fontSize: 34,
      lineHeight: 42,
      fontWeight: '700',
      textAlign: 'center',
      textAlignVertical: 'center',
      alignSelf: 'stretch',
    },
    options: { gap: 20 },
  });
