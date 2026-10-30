import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { ColorValue } from 'react-native';

import { FONT, colors } from '@/lib/theme';

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
        tabBarLabelStyle: { fontFamily: FONT.bold, fontSize: 11 },
        // Barra flutuante em pílula, como nos apps de referência.
        tabBarStyle: {
          position: 'absolute',
          left: 16,
          right: 16,
          bottom: 16,
          height: 70,
          paddingTop: 8,
          paddingBottom: 8,
          borderRadius: 35,
          backgroundColor: '#121212',
          borderTopWidth: 0,
          borderWidth: 1,
          borderColor: colors.border,
        },
      }}>
      <Tabs.Screen name="index" options={tab('Agendar', 'tennisball', 'tennisball-outline')} />
      <Tabs.Screen name="ranking" options={tab('Ranking', 'trophy', 'trophy-outline')} />
      <Tabs.Screen name="eventos" options={tab('Eventos', 'calendar', 'calendar-outline')} />
      <Tabs.Screen name="social" options={tab('Social', 'people', 'people-outline')} />
      <Tabs.Screen name="perfil" options={tab('Perfil', 'person', 'person-outline')} />
    </Tabs>
  );
}
