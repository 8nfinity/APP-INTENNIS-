import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { ColorValue } from 'react-native';

import { colors } from '@/lib/theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const tab = (title: string, icon: IconName, iconOff: IconName) => ({
  title,
  tabBarIcon: ({ color, size, focused }: { color: ColorValue; size: number; focused: boolean }) => (
    <Ionicons name={focused ? icon : iconOff} color={color as string} size={size} />
  ),
});

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontWeight: '700', fontSize: 11 },
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
      }}>
      <Tabs.Screen name="index" options={tab('Início', 'tennisball', 'tennisball-outline')} />
      <Tabs.Screen name="ranking" options={tab('Ranking', 'trophy', 'trophy-outline')} />
      <Tabs.Screen name="eventos" options={tab('Eventos', 'calendar', 'calendar-outline')} />
      <Tabs.Screen name="social" options={tab('Social', 'people', 'people-outline')} />
      <Tabs.Screen name="perfil" options={tab('Perfil', 'person', 'person-outline')} />
    </Tabs>
  );
}
