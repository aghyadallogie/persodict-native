import { Screen } from '@/components/ui/screen';
import { useAccount } from '@/features/account/use-account';
import { langs } from '@/features/settings/langs';
import { LanguageFlag } from '@/features/settings/language-flag';
import { useSettings } from '@/features/settings/use-settings';
import { useAuth } from '@/lib/auth';
import { ThemeColors, useThemedStyles } from '@/lib/use-themed-styles';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';

export default function SettingsScreen() {
  const { styles } = useThemedStyles(createStyles);
  const { signOut } = useAuth();
  const { email, isLoading: accountLoading } = useAccount();
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
        <Text style={styles.title}>Please select at least one language</Text>

        {isLoading && !userLangs.length ? (
          <Text style={styles.helper}>Loading languages…</Text>
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

        <View>
          <Text style={styles.sectionLabel}>Account: </Text>
          <Text style={styles.email} numberOfLines={1} selectable>
            {email ?? (accountLoading ? 'Loading…' : '—')}
          </Text>
        </View>
        <View style={styles.card}>
          <Pressable
            onPress={handleLogout}
            style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
          >
            <Text style={styles.logoutText}>Log Out</Text>
          </Pressable>
        </View>
      </ScrollView>
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    scroll: {
      paddingBottom: 32,
      justifyContent: 'space-between',
      flexGrow: 1,
    },
    title: {
      color: colors.text,
      fontSize: 20,
      fontWeight: '600',
      textAlign: 'center',
      marginVertical: 24,
    },
    helper: { color: colors.textMuted, textAlign: 'center', marginTop: 16 },
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
    sectionLabel: {
      color: colors.text,
      fontSize: 12,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginTop: 32,
      paddingHorizontal: 12,
    },
    email: {
      color: colors.textMuted,
      fontSize: 14,
      paddingLeft: 24,
      paddingTop: 4,
      paddingBottom: 18
    },
    card: {
      borderWidth: 1,
      borderRadius: 12,
      borderColor: colors.border,
      boxShadow: `0px 2px 8px ${colors.shadow}`,
      paddingHorizontal: 16,
      marginHorizontal: 8,
      backgroundColor: 'transparent',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 14,
    },
    rowPressed: { opacity: 0.7 },
    logoutText: { color: colors.text, fontSize: 16, fontWeight: '600' },
  });