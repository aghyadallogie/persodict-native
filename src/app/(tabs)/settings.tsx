import { Screen } from '@/components/ui/screen';
import { langs } from '@/features/settings/langs';
import { LanguageFlag } from '@/features/settings/language-flag';
import { useSettings } from '@/features/settings/use-settings';
import { useAuth } from '@/lib/auth';
import { useTheme } from '@/lib/theme';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

export default function SettingsScreen() {
  const { colors } = useTheme();
  const { signOut } = useAuth();
  const {
    userLangs,
    isLoading,
    hasError,
    savingCode,
    toggleError,
    toggleLang,
    refresh,
  } = useSettings();

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: () => signOut() },
    ]);
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={[styles.title, { color: colors.text }]}>
          Please select at least one language
        </Text>

        {isLoading && !userLangs.length ? (
          <Text style={[styles.helper, { color: colors.textMuted }]}>
            Loading languages…
          </Text>
        ) : hasError ? (
          <Text onPress={() => refresh()} style={styles.errorText}>
            Failed to load settings. Tap to retry.
          </Text>
        ) : (
          <View style={styles.grid}>
            {langs.map(({ code }) => (
              <LanguageFlag
                key={code}
                code={code}
                picked={userLangs.includes(code)}
                saving={savingCode === code}
                onToggle={() => toggleLang(code)}
              />
            ))}
          </View>
        )}

        {toggleError && (
          <Text style={styles.errorText} accessibilityRole="alert">
            {toggleError}
          </Text>
        )}

        {!isLoading && !hasError && userLangs.length === 0 && (
          <Text style={[styles.helper, { color: colors.textMuted }]}>
            You haven't selected any languages yet.
          </Text>
        )}

        <Pressable
          style={[styles.logoutButton, { borderColor: colors.border }]}
          onPress={handleLogout}
        >
          <Text style={styles.logoutText}>Log Out</Text>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 32 },
  title: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginVertical: 24,
  },
  helper: { textAlign: 'center', marginTop: 16 },
  errorText: {
    color: '#DC2626',
    textAlign: 'center',
    marginTop: 16,
    fontSize: 13,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
  },
  logoutButton: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 24,
  },
  logoutText: { color: '#DC2626', fontSize: 16, fontWeight: '600' },
});