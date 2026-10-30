import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { ColorValue } from 'react-native';

import { colors } from '@/lib/theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const tab = (title: string, icon: IconName) => ({
  title,
  tabBarIcon: ({ color, size }: { color: ColorValue; size: number }) => (
    <Ionicons name={icon} color={color as string} size={size} />
  ),
});

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.ball,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border },
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.text,
        headerShadowVisible: false,
      }}>
      <Tabs.Screen name="index" options={tab('Agendar', 'tennisball')} />
      <Tabs.Screen name="ranking" options={tab('Ranking', 'trophy')} />
      <Tabs.Screen name="eventos" options={tab('Eventos', 'calendar')} />
      <Tabs.Screen name="social" options={tab('Social', 'people')} />
      <Tabs.Screen name="perfil" options={tab('Perfil', 'person')} />
    </Tabs>
  );
}
