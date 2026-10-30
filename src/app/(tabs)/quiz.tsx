import { Screen } from '@/components/ui/screen';
import { ThemeColors, useThemedStyles } from '@/lib/use-themed-styles';
import { StyleSheet, Text } from 'react-native';

export default function QuizScreen() {
  const { styles } = useThemedStyles(createStyles);

  return (
    <Screen>
      <Text style={styles.text}>Quiz Screen Placeholder</Text>
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    text: { color: colors.text },
  });
