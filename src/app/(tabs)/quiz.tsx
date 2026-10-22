// src/app/(tabs)/home.tsx
import { Screen } from '@/components/ui/screen';
import { useTheme } from '@/lib/theme';
import { Text } from 'react-native';

export default function HomeScreen() {
  const { colors } = useTheme();
  return (
    <Screen>
      <Text style={{ color: colors.text }}>Quiz Screen Placeholder</Text>
    </Screen>
  );
}