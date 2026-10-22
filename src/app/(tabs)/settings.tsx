// src/app/(tabs)/settings.tsx
import { Screen } from '@/components/ui/screen';
import { useAuth } from '@/lib/auth';
import { useTheme } from '@/lib/theme';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

export default function SettingsScreen() {
  const { colors } = useTheme();
  const { signOut } = useAuth();

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: () => signOut(),
      },
    ]);
  };

  return (
    <Screen>
      <View style={styles.content}>
        <Text style={[styles.heading, { color: colors.text }]}>Settings</Text>

        <Pressable
          style={[styles.logoutButton, { borderColor: colors.border }]}
          onPress={handleLogout}
        >
          <Text style={[styles.logoutText, { color: '#DC2626' }]}>Log Out</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, justifyContent: 'space-between' },
  heading: { fontSize: 24, fontWeight: 'bold' },
  logoutButton: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  logoutText: { fontSize: 16, fontWeight: '600' },
});