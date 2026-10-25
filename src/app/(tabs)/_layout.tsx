import { useTheme } from '@/lib/theme';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Pressable } from 'react-native';

export default function TabLayout() {
    const { colors, isDark, setMode } = useTheme();

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: { backgroundColor: colors.background, borderTopColor: colors.border, paddingTop: 6 },
                tabBarActiveTintColor: colors.primary,
                tabBarInactiveTintColor: colors.textMuted,
            }}
        >
            <Tabs.Screen
                name="home"
                options={{
                    title: '',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="home-outline" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="history"
                options={{
                    title: '',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="time-outline" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="quiz"
                options={{
                    title: '',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="help-circle-outline" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="settings"
                options={{
                    title: '',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="settings-outline" size={size} color={color} />
                    ),
                }}
            />

            {/* Theme toggle — rendered as a tab button, but does NOT navigate */}
            <Tabs.Screen
                name="theme-toggle"
                options={{
                    title: '',
                    tabBarButton: () => (
                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                            onPress={() => setMode(isDark ? 'light' : 'dark')}
                            style={{
                                alignItems: 'center',
                                justifyContent: 'center',
                                paddingVertical: 7,
                            }}
                        >
                            <Ionicons
                                name={isDark ? 'sunny-outline' : 'moon-outline'}
                                size={24}
                                color={colors.textMuted}
                            />
                        </Pressable>
                    ),
                }}
            />
        </Tabs>
    );
}